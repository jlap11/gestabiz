# MASSIVE BUG: 41 useEffect with fetch callbacks in dependencies

## Critical Discovery

After binary elimination testing, discovered the REAL problem is NOT in UI components,
but in **41 useEffect hooks with fetch callbacks in dependencies** across the codebase.

These are creating:
- Exponential Realtime subscription accumulation
- Callback recreation on every render
- Interval recreation (2 confirmed cases)
- Memory leaks

## Affected Hooks

### HIGH PRIORITY (Realtime subscriptions + auto-fetch)

1. **useSupabase.ts** (3 useEffect):
   - Line 663: `[userId, fetchAppointments]`
   - Line 731: `[fetchSettings]`
   - Line 794: `[fetchStats]`

2. **useInAppNotifications.ts** (2 useEffect):
   - Line 270: `[fetchNotifications]`
   - Line 277: `[autoFetch, userId, fetchNotifications]`

3. **useEmployeeRequests.ts** (3 useEffect):
   - Line 92: `[fetchRequests, autoFetch]`
   - Line 118: `[businessId, userId, autoFetch, fetchRequests]`

4. **useChat.ts** (7 useEffect):
   - Line 331: `[userId, fetchConversations]`
   - Line 704: `[userId, fetchConversations]`
   - Line 804: `[userId, activeConversationId, fetchTypingIndicators, markMessagesAsRead]`
   - Line 812: `[fetchConversations]`
   - Line 820: `[activeConversationId, fetchMessages, fetchTypingIndicators]`

5. **useMessages.ts** (2 useEffect):
   - Line 159: `[hasMore, loading, oldestMessageId, conversationId, fetchMessages]`
   - Line 537: `[conversationId, userId, fetchMessages]`

6. **useConversations.ts** (1 useEffect):
   - Line 560: `[userId, businessId, fetchConversations, fetchStats]`

### MEDIUM PRIORITY (auto-fetch but no Realtime)

7. **useSupabaseData.ts** (4 useEffect):
   - Line 249, 277, 297, 308

8. **useChartData.ts** (2 useEffect):
   - Line 263, 268

9. **useAdminBusinesses.ts** (1 useEffect):
   - Line 57

10. **useUserRoles.ts** (1 useEffect):
   - Line 202

## The Pattern

```typescript
// WRONG (current - causes accumulation)
const fetchData = useCallback(async () => {
  // ... supabase query
}, [deps])

useEffect(() => {
  if (condition) {
    fetchData()
  }
  
  // Maybe Realtime subscription here
  const channel = supabase.channel(...)
    .on('postgres_changes', ...)
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [fetchData, otherDeps]) // ⚠️ fetchData in deps = recreation hell
```

## The Fix

```typescript
// CORRECT (prevents accumulation)
const fetchData = useCallback(async () => {
  // ... supabase query
}, [deps]) // Keep deps for useCallback

useEffect(() => {
  if (condition) {
    fetchData() // Call directly inside useEffect
  }
  
  // Realtime subscription
  const channel = supabase.channel(...)
    .on('postgres_changes', () => {
      fetchData() // Closure captures latest fetchData
    })
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [condition, otherNonCallbackDeps]) // ✅ Remove fetchData from deps!
```

## Impact Estimate

**Before fixes:**
- Each hook with this pattern × component re-renders = exponential subscriptions
- Example: useChat has 7 useEffect with callbacks
- After 10 re-renders: 7×10 = 70 active Realtime channels
- Each channel making queries on events
- Rate limit hit in minutes

**After fixes:**
- 1 subscription per hook per component mount
- No accumulation on re-renders
- Stable memory usage
- No rate limiting

## Action Plan

Need to fix **41 useEffect** across **10 hooks files**:

1. Remove fetch callbacks from useEffect deps
2. Add eslint-disable comment
3. Keep fetch calls inside useEffect (closure will work)
4. Test each hook individually

## Priority Order

1. useChat.ts (7 fixes) - Used in FloatingChatButton
2. useSupabase.ts (3 fixes) - Used in all dashboards
3. useInAppNotifications.ts (2 fixes) - Used in NotificationBell
4. useEmployeeRequests.ts (3 fixes) - Used in EmployeeOnboarding
5. useMessages.ts (2 fixes) - Used in ChatLayout
6. useConversations.ts (1 fix) - Used in ChatLayout
7. useSupabaseData.ts (4 fixes) - Used in multiple components
8. Rest (lower priority)

## Testing Strategy

After each hook fixed:
1. Commit changes
2. Test login → navigate → wait 5 min
3. Check browser console for accumulated channels
4. Monitor Supabase dashboard for query count
5. If no crash, proceed to next hook

## Estimated Time

- 41 fixes × 2 min each = 82 minutes
- Testing between fixes = 30 minutes
- Total: ~2 hours of focused work

## Note

This is why useServiceStatus fix (commit 6c878be) and useUpcomingAppointments fix (commit d060d2a) 
didn't fully solve the problem - they were only 2 out of 41 problematic useEffect.
