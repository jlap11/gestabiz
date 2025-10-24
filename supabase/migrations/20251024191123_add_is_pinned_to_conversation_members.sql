-- Migration: add is_pinned to conversation_members
-- Purpose: allow users to pin conversations in UI and persist state

-- 1) Column addition
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- 2) Index to support filtering/ordering by pinned per user
CREATE INDEX IF NOT EXISTS conversation_members_user_pinned_idx
  ON public.conversation_members (user_id, is_pinned);

-- 3) Backfill to ensure no NULLs remain
UPDATE public.conversation_members
SET is_pinned = COALESCE(is_pinned, false)
WHERE is_pinned IS NULL;

-- RLS: existing update policies on conversation_members should already allow members to update their own settings.
-- No policy changes required here.