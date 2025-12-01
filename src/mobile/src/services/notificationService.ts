import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

export async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data
    
    console.log('Push notification token:', token)
  } else {
    console.log('Must use physical device for Push Notifications')
  }

  return token
}

export function setupNotificationHandlers() {
  // Handle notifications received while app is foregrounded
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification)
  })

  // Handle user tapping on notification
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response)
    // Navigate to appropriate screen based on notification data
  })
}

export async function schedulePushNotification(title: string, body: string, data?: any, seconds: number = 2) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: { seconds },
  })
}
