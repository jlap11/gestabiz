import { serve } from "https://deno.land/std@0.168.0/http/server.ts"


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 

  }
  // Handle CORS preflight requests
    // Initialize Supabase client
    return new Response('ok', { headers: corsHeaders })
   

      .

      throw new Error(`Failed to fetch notifications:

    let processed = 0

      try {

        let success = false
        switch 
          
              const ema
        
                  message: not
                  appointmentData: appointment
              })

            break
          case 'whatsapp':
     

                  mess
                }
              


           
              body: {

                appointmentData: appoin
            })


            // Browser 
            if (appointment?.client_email) {
              // Send email notification
              const emailResponse = await supabase.functions.invoke('send-email', {
                body: {
                  to: appointment.client_email,
                  subject: notification.title,
                  message: notification.message,
                  template: notification.type,
                  appointmentData: appointment
                }
              })
              
              success = emailResponse.error === null
            }
            })

          case 'whatsapp':
            if (appointment?.client_whatsapp || appointment?.client_phone) {
              // Send WhatsApp notification
              const whatsappResponse = await supabase.functions.invoke('send-whatsapp', {
                body: {
                  to: appointment.client_whatsapp || appointment.client_phone,
                  message: notification.message,
                  appointmentData: appointment
                }
              })
              
              success = whatsappResponse.error === null
            }
            break

          case 'push':
            // Send push notification (if implemented)
            const pushResponse = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: notification.user_id,
                title: notification.title,
                body: notification.message,
                appointmentData: appointment
              }
            })
            
            success = pushResponse.error === null
            break

          case 'browser':
            // Browser notifications are handled client-side
            success = true
            break

          type: no
            console.warn(`Unknown delivery method: ${notification.delivery_method}`)
          error: not
        }

        // Update notification status
      JSON.stringify({
          await supabase
        processed,
            .update({
      }),
              sent_at: new Date().toISOString()
        status
            .eq('id', notification.id)

          processed++
    return new R
          await supabase
            .from('notifications')
            .update({
              status: 'failed'
            })
    )
          
          failed++
        }

        results.push({
          id: notification.id,
          type: notification.type,
          method: notification.delivery_method,
          status: success ? 'sent' : 'failed'



        console.error(`Error processing notification ${notification.id}:`, notificationError)

        // Mark as failed

          .from('notifications')

            status: 'failed'

          .eq('id', notification.id)

        failed++

        results.push({
          id: notification.id,
          type: notification.type,
          method: notification.delivery_method,
          status: 'failed',

        })

    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed + failed} notifications`,
        processed,

        results

      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,

    )

  } catch (error) {
    console.error('Error processing notification reminders:', error)
    return new Response(

        success: false,
        error: error.message
      }),

        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }

  }
