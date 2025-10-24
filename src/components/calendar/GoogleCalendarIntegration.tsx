import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  WarningCircle as AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  ArrowClockwise as RefreshCw,
  Gear as Settings,
} from '@phosphor-icons/react'
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync'
import { User } from '@/types'
import { toast } from 'sonner'

interface GoogleCalendarIntegrationProps {
  user: User
}

export default function GoogleCalendarIntegration({
  user,
}: Readonly<GoogleCalendarIntegrationProps>) {
  const { t } = useLanguage()
  const {
    syncSettings,
    isConnected,
    isConnecting,
    isSyncing,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncWithGoogleCalendar,
    updateSyncSettings,
  } = useGoogleCalendarSync(user)

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleConnect = async () => {
    try {
      await connectGoogleCalendar()
    } catch {
      toast.error('Failed to connect Google Calendar')
    }
  }

  const handleDisconnect = async () => {
    if (
      window.confirm(
        'Are you sure you want to disconnect Google Calendar? This will stop all automatic syncing.'
      )
    ) {
      await disconnectGoogleCalendar()
    }
  }

  const handleSyncNow = async () => {
    try {
      await syncWithGoogleCalendar()
    } catch {
      toast.error('Sync failed')
    }
  }

  const formatLastSync = (lastSync: string | undefined) => {
    if (!lastSync) return 'Never'
    const date = new Date(lastSync)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`
    return date.toLocaleDateString()
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="text-primary" size={24} />
            <div>
              <CardTitle>Google Calendar Integration</CardTitle>
              <CardDescription>
                Sync your appointments with Google Calendar for seamless scheduling
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle size={16} />
            <AlertDescription>
              Connect your Google Calendar to automatically sync appointments and keep all your
              schedules in one place.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium">Benefits of connecting:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Automatic bidirectional sync between apps
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                View appointments in your favorite calendar app
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Prevent double-booking across platforms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Access appointments on all your devices
              </li>
            </ul>
          </div>

          <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
            {isConnecting ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Connecting...
              </>
            ) : (
              <>
                <Calendar size={16} />
                Connect Google Calendar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-primary" size={24} />
            <div>
              <CardTitle className="flex items-center gap-2">
                Google Calendar
                <Badge variant="secondary" className="text-green-600 bg-green-50">
                  Connected
                </Badge>
              </CardTitle>
              <CardDescription>Your appointments are synced with Google Calendar</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
            <Settings size={16} />
            Settings
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <span className="text-sm">Last sync: {formatLastSync(syncSettings?.last_sync)}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Sync Now
              </>
            )}
          </Button>
        </div>

        {/* Quick Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-sync</p>
              <p className="text-sm text-muted-foreground">
                Automatically sync changes in real-time
              </p>
            </div>
            <Switch
              checked={syncSettings?.auto_sync || false}
              onCheckedChange={checked => updateSyncSettings({ auto_sync: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync direction</p>
              <p className="text-sm text-muted-foreground">Choose how appointments are synced</p>
            </div>
            <Select
              value={syncSettings?.sync_direction || 'both'}
              onValueChange={(value: 'both' | 'export_only' | 'import_only') =>
                updateSyncSettings({ sync_direction: value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both ways</SelectItem>
                <SelectItem value="export_only">Export only</SelectItem>
                <SelectItem value="import_only">Import only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Advanced Settings</h4>

            <div>
              <p className="text-sm font-medium mb-2">Calendar ID</p>
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {syncSettings?.calendar_id}
              </code>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Sync Status</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="capitalize">{syncSettings?.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={syncSettings?.enabled ? 'default' : 'secondary'}>
                    {syncSettings?.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(syncSettings?.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {syncSettings?.sync_errors && syncSettings.sync_errors.length > 0 && (
              <Alert>
                <AlertCircle size={16} />
                <AlertDescription>
                  <p className="font-medium mb-1">Recent sync errors:</p>
                  <ul className="text-xs space-y-1">
                    {syncSettings.sync_errors.slice(0, 3).map((error, index) => (
                      <li key={index} className="text-red-600">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Disconnect */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Disconnect Google Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
