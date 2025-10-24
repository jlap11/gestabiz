import { useEffect } from 'react'

export default function GoogleAuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const searchParams = window.location.search || '?'
        const urlParams = new URLSearchParams(searchParams)
        const code = urlParams.get('code')
        const error = urlParams.get('error')

        if (error) {
          // Send error to parent window
          window.opener?.postMessage(
            {
              type: 'GOOGLE_AUTH_ERROR',
              error: error,
            },
            window.location.origin
          )
          window.close()
          return
        }

        if (code) {
          try {
            // Check if Google credentials are configured
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
            const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET

            if (!clientId || !clientSecret) {
              throw new Error('Google OAuth credentials not configured')
            }

            const redirectUri = `${window.location.origin}/auth/google/callback`

            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
              }),
            })

            if (!tokenResponse.ok) {
              throw new Error('Failed to exchange code for token')
            }

            const tokenData = await tokenResponse.json()

            // Send success to parent window
            window.opener?.postMessage(
              {
                type: 'GOOGLE_AUTH_SUCCESS',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresIn: tokenData.expires_in,
              },
              window.location.origin
            )

            window.close()
          } catch {
            // Send error to parent window
            window.opener?.postMessage(
              {
                type: 'GOOGLE_AUTH_ERROR',
                error: 'Failed to complete authentication',
              },
              window.location.origin
            )
            window.close()
          }
        } else {
          // No code parameter, just close
          window.close()
        }
      } catch {
        // Send error to parent window
        window.opener?.postMessage(
          {
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Authentication callback error',
          },
          window.location.origin
        )
        window.close()
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
