import React, {Component} from 'react'
import { Platform, View } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import firebase from 'react-native-firebase'

export default class App extends Component {

    constructor(props){
        super(props)
    }

    async componentDidMount() {
        this.checkPermission()
        this.createNotificationListeners() //add this line
    }

////////////////////// Add these methods //////////////////////

    //Remove listeners allocated in createNotificationListeners()
    componentWillUnmount() {
        this.notificationListener()
        this.notificationOpenedListener()
    }

    async checkPermission() {
        const enabled = await firebase.messaging().hasPermission()
        if (enabled) {
            this.getToken()
        } else {
            this.requestPermission()
        }
    }

    async getToken() {
        let fcmToken = await AsyncStorage.getItem('fcmToken')
        if (!fcmToken) {
            fcmToken = await firebase.messaging().getToken()
            if (fcmToken) {
                // user has a device token
                await AsyncStorage.setItem('fcmToken', fcmToken)
            }
        }
    }

    async requestPermission() {
        try {
            await firebase.messaging().requestPermission()
            // User has authorised
            this.getToken()
        } catch (error) {
            // User has rejected permissions

            console.log('permission rejected')
        }
    }

    async createNotificationListeners() {
        /*
        * Triggered when a particular notification has been received in foreground
        * */
        this.notificationListener = firebase.notifications().onNotification((notification) => {

            const channel = new firebase.notifications.Android.Channel(
                'trusteeWalletChannel',
                'Trustee wallet channel',
                firebase.notifications.Android.Importance.Max
            ).setDescription('Trustee wallet channel for notifications')
            firebase.notifications().android.createChannel(channel)

            if (Platform.OS === 'android') {

                const localNotification = new firebase.notifications.Notification({
                    sound: 'default',
                    show_in_foreground: true,
                })
                .setNotificationId(notification.notificationId)
                .setTitle(notification.title)
                .setSubtitle(notification.subtitle)
                .setBody(notification.body)
                .setData(notification.data)
                .android.setChannelId('trusteeWalletChannel') // e.g. the id you chose above
                .android.setSmallIcon('ic_notification') // create this icon in Android Studio
                .android.setColor('#000000') // you can set a color here
                .android.setPriority(firebase.notifications.Android.Priority.High);

                firebase.notifications()
                    .displayNotification(localNotification)
                    .catch(err => console.error(err));

            } else if (Platform.OS === 'ios') {

                const localNotification = new firebase.notifications.Notification()
                    .setNotificationId(notification.notificationId)
                    .setTitle(notification.title)
                    .setSubtitle(notification.subtitle)
                    .setBody(notification.body)
                    .setData(notification.data)
                    .ios.setBadge(notification.ios.badge);

                firebase.notifications()
                    .displayNotification(localNotification)
                    .catch(err => console.error(err));

            }

            // const { title, body } = notification
            //
            // firebase.notifications().displayNotification(notification)

            //this.showAlert(title, body)
        })

        /*
        * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
        * */
        this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
            const { title, body } = notificationOpen.notification
            //this.showAlert(title, body)
        })

        /*
        * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
        * */
        const notificationOpen = await firebase.notifications().getInitialNotification()
        if (notificationOpen) {
            const { title, body } = notificationOpen.notification
            //this.showAlert(title, body)
        }
        /*
        * Triggered for data only payload in foreground
        * */
        this.messageListener = firebase.messaging().onMessage((message) => {
            //process data message

            // console.log(JSON.stringify(message))
        })
    }


    render() {
        return (
            <View style={{flex: 1}}>
                { this.props.children }
            </View>
        )
    }
}
