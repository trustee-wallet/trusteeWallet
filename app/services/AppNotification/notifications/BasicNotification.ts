import firebase  from 'react-native-firebase'
import { NotificationTexts } from '../Types'
import { AppNewsItem, AppNewsJson } from '../../../appstores/Stores/AppNews/Types'
import { strings } from '../../i18n'
import { NotificationOpen } from 'react-native-firebase/notifications'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import Log from '../../Log/Log'

export default class BasicNotification {
    public notificationType: string
    public notificationTexts: NotificationTexts
    public notificationCounter: number

    constructor() {
        this.notificationType = ''
        this.notificationTexts = { title: 'default', description: 'default' }
        this.notificationCounter = 0
    }

    getOpenedNotification = async (): Promise<AppNewsJson> => {
        Log.log('PUSH getOpenedNotification init')
        const openedNotification: NotificationOpen = await firebase.notifications().getInitialNotification()
        Log.log('PUSH getOpenedNotification', openedNotification)
        if (typeof openedNotification === 'undefined' || !openedNotification ) {
            throw new Error('Empty firebase.notification')
            // @ts-ignore
        } else if (openedNotification !== null && openedNotification.notification._data.notificationType) {
            // @ts-ignore
            return openedNotification.notification._data
        } else if (typeof openedNotification.action !== 'undefined') {
            if (openedNotification.action === 'android.intent.action.MAIN' || openedNotification.action === 'com.apple.UNNotificationDefaultActionIdentifier') {
                throw new Error('Empty firebase.notification')
            }
        } else {
            Log.err('This type of firebase.notification isn`t supported ', openedNotification)
            throw new Error('This type of firebase.notification isn`t supported')
        }
    }

    getTextsForNotification = (item: AppNewsItem): NotificationTexts => {
        let title = item.newsCustomTitle
        let description = item.newsCustomText
        const data = {currencyCode : item.currencyCode, walletName : item.walletName, currencySymbol : '', currencyName : '', amountPretty : '',
            addressAmount : 0, balance : 0, addressTo : '', addressFrom : '', createdAt: ''}
        for (const code in item.newsJson) {
            // @ts-ignore
            data[code] = item.newsJson[code]
        }
        const currency = BlocksoftDict.getCurrencyAllSettings(item.currencyCode)
        if (currency) {
            data.currencySymbol = currency.currencySymbol
            data.currencyName = currency.currencyName
        } else {
            data.currencySymbol = ''
            data.currencyName = ''
        }

        data.amountPretty = ''
        if (typeof data.addressAmount !== 'undefined' && data.addressAmount * 1 > 0) {
            // @ts-ignore
            const tmp = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makePretty(data.addressAmount) * 1
            // @ts-ignore
            data.amountPretty = BlocksoftPrettyNumbers.makeCut(tmp).separated
        } else if (typeof data.balance !== 'undefined' && data.balance * 1 > 0) {
            // @ts-ignore
            const tmp = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makePretty(data.balance) * 1
            // @ts-ignore
            data.amountPretty = BlocksoftPrettyNumbers.makeCut(tmp).separated
        }
        if (!title || title.length < 10) {
            title = strings('pushNotifications.' + item.newsName + '.title', data)
        }
        if (!description || description.length < 10) {
            description = strings('pushNotifications.' + item.newsName + '.description', data)
        }

        return <NotificationTexts>{
            title,
            description
        }
    }

    canBeShowed = (): boolean => {
        return this.notificationCounter < 5
    }

    incrementNotificationCounter = (): void => {
        this.notificationCounter = this.notificationCounter + 1
        if(this.notificationCounter === 5) {
            setTimeout(() => {
                this.notificationCounter = 0
            }, 5000)
        }
    }
}
