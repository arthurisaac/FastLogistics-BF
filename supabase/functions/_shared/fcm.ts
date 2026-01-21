// FCM (Firebase Cloud Messaging) client for push notifications
export interface PushNotification {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushNotification(notification: PushNotification): Promise<boolean> {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')

  if (!fcmServerKey) {
    console.warn('⚠️ FCM_SERVER_KEY not configured, skipping push notification')
    return false
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmServerKey}`,
      },
      body: JSON.stringify({
        to: notification.token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        priority: 'high',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ FCM error:', error)
      return false
    }

    const result = await response.json()
    console.log('✅ Push notification sent:', result)
    return true
  } catch (error) {
    console.error('❌ Failed to send push notification:', error)
    return false
  }
}
