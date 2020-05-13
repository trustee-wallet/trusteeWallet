import firebase  from 'react-native-firebase'
import { NotificationTexts } from '../Types'
import { AppNewsItem, AppNewsJson } from '../../../appstores/Stores/AppNews/Types'
import { strings } from '../../i18n'
import { NotificationOpen } from 'react-native-firebase/notifications'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'


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
        const openedNotification: NotificationOpen = await firebase.notifications().getInitialNotification()
        if (typeof openedNotification === 'undefined' || !openedNotification ) {
            throw new Error('Empty firebase.notification')
        } else if (openedNotification !== null && openedNotification.notification._data.notificationType === this.notificationType) {
            return openedNotification.notification._data
        } else {
            throw new Error('This type of firebase.notification isn`t supported ' + JSON.stringify(openedNotification))
        }
    }

    getTextsForNotification = (item: AppNewsItem): NotificationTexts => {
        let title = item.newsCustomTitle
        let description = item.newsCustomText
        const data = {currencyCode : item.currencyCode, walletName : item.walletName, currencySymbol : '', currencyName : '', amountPretty : '', addressAmount : 0, balance : 0}
        for (let code in item.newsJson) {
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
            const tmp = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makePretty(data.addressAmount) * 1
            data.amountPretty = parseFloat(tmp.toFixed(5)) === 0 ? parseFloat(tmp.toFixed(10)) : parseFloat(tmp.toFixed(5))
        } else if (typeof data.balance !== 'undefined' && data.balance * 1 > 0) {
            const tmp = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makePretty(data.balance) * 1
            data.amountPretty = parseFloat(tmp.toFixed(5)) === 0 ? parseFloat(tmp.toFixed(10)) : parseFloat(tmp.toFixed(5))
        }
        if (!title || title.length < 10) {
            title = strings('pushNotifications.' + item.newsName + '.title', data)
        }
        if (!description || description.length < 10) {
            description = strings('pushNotifications.' + item.newsName + '.description', data)
        }

        return {
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
