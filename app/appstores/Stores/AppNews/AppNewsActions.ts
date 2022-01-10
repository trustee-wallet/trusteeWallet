/**
 * @version 0.43
 */
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import NavStore from '@app/components/navigation/NavStore'

import { strings, sublocale } from '@app/services/i18n'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import appNewsDS from '@app/appstores/DataSource/AppNews/AppNews'
import AppNotificationPopup from '@app/services/AppNotification/AppNotificationPopup'
import AppNotificationListener from '@app/services/AppNotification/AppNotificationListener'

import store from '@app/store'
import config from '@app/config/config'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import Log from '@app/services/Log/Log'
import appNewsInitStore from '@app/appstores/Stores/AppNews/AppNewsInitStore'

let CACHE_BADGE = 0

export namespace AppNewsActions {

    /**
     * @param notification
     * @param title
     * @param subtitle
     * return true when NavStore need to be called outside the function (to reload notifications screen if called from local push open etc)
     */
    export const onOpen = async (notification: any, title: string = '', subtitle: string = '', checkLock = true): Promise<boolean> => {
        try {
            if (checkLock && MarketingEvent.UI_DATA.IS_LOCKED && !MarketingEvent.UI_DATA.IS_ACTIVE) {
                await Log.log('ACT/AppNewsActions onOpen need unlock')
                setLockScreenConfig({flowType : LockScreenFlowTypes.PUSH_POPUP_CALLBACK, callback : async () => {
                    await Log.log('ACT/AppNewsActions onOpen after lock screen')
                    if (await AppNewsActions.onOpen(notification, title, subtitle, false)) {
                        NavStore.reset('TabBar', { screen: 'NotificationsScreen', initial: false })
                    }  else {
                        NavStore.reset('TabBar')
                    }
                }})
                NavStore.reset('LockScreenPop')
                return false
            }

            await Log.log('ACT/AppNewsActions onOpen', notification)
            if (notification.newsOpenedAt === null) {
                AppNewsActions.markAsOpened(notification.id, notification.hasBadge)
            }
            if (notification.newsUrl && notification.newsUrl !== 'null' && notification.newsUrl !== '') {
                let url = notification.newsUrl
                if (url.indexOf('?') === -1) {
                    url += '?forceLang=' + sublocale()
                } else {
                    url += '&forceLang=' + sublocale()
                }
                NavStore.goNext('WebViewScreen', {
                    url: url,
                    title: strings('notifications.newsTitle')
                })
                return false
            }

            // orders processing
            const transactionHash = notification.newsJson?.transactionHash || false
            const transactionStatus = notification.newsJson?.transactionStatus || false
            const currencyCode = notification.newsJson?.currencyCode || false
            const orderHash = notification.newsJson?.orderHash || false
            if (title === '') {
                title = notification?.newsCustomTitle || false
            }
            if (subtitle === '') {
                subtitle = notification?.newsCustomText || false
            }
            const notificationToTx = {
                title,
                subtitle,
                newsName: notification.newsName,
                createdAt: notification.newsCreated
            }
            if (orderHash) {
                showModal({
                    type: 'NOTIFICATION_MODAL',
                    title: title,
                    description: subtitle && subtitle !== '' ? subtitle : title,
                    rates: true,
                    textRatesBtn: strings('account.transactionScreen.order'),
                    noCallback: () => {
                        NavStore.reset('MarketScreen', { screen: 'MarketScreen', params: { orderHash } })
                    }
                })
                return false
            } else if (transactionHash) {
                NavStore.goNext('AccountTransactionScreen', {
                    txData: {
                        currencyCode,
                        transactionHash,
                        transactionStatus,
                        walletHash: notification.walletHash,
                        notification: notificationToTx
                    },
                    source : 'AppNewsActions'
                })
                return false
            } else {
                const exchangeRatesNotifs = await settingsActions.getSetting('exchangeRatesNotifs')
                const newsGroup = typeof notification.data !== 'undefined' && typeof notification.data.type !== 'undefined' && notification.data.type ? notification.data.type : notification.newsGroup
                const isRates = +exchangeRatesNotifs && newsGroup === 'RATES_CHANGING'
                if (isRates) {
                    showModal({
                        type: 'NOTIFICATION_MODAL',
                        // title: title,
                        description: subtitle && subtitle !== '' ? subtitle : title,
                        rates: true,
                        noCallback: async () => {
                            await settingsActions.setSettings('exchangeRatesNotifs', '0')
                            await AppNotificationListener.updateSubscriptionsLater()
                        }
                    })
                } else {
                    showModal({
                        type: 'NOTIFICATION_MODAL',
                        // title: title,
                        description: subtitle && subtitle !== '' ? subtitle : title
                    })
                }
                return true
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ACT/AppNewsActions onOpen error ' + e.message)
            }
            await Log.log('ACT/AppNewsActions onOpen error ' + e.message)
            return true
        }
    }

    export const displayBadge = async (number: number): Promise<void> => {
        if (number < 0) number = 0
        CACHE_BADGE = number
        return AppNotificationPopup.displayBadge(number)
    }

    export const displayPush = async (appNewsList: Array<AppNewsItem>): Promise<void> => {

        if (!appNewsList) return

        const unique = {}
        for (const news of appNewsList) {
            try {
                const key = typeof news.newsJson !== 'undefined' && news.newsJson ? (
                    typeof news.newsJson.transactionHash !== 'undefined' ? news.newsJson.transactionHash : news.newsServerId
                ) : news.id
                // @ts-ignore
                if (typeof unique[key] === 'undefined') {
                    // @ts-ignore
                    unique[key] = 1
                    // somehow here its not breaking - but later is breaking android with 280000000000000000000000 values
                    if (typeof news.newsJson !== 'undefined' && news.newsJson) {
                        if (typeof news.newsJson.addressAmount !== 'undefined' && news.newsJson.addressAmount !== '0' && news.newsJson.addressAmount !== 0) {
                            const tmp = BlocksoftPrettyNumbers.setCurrencyCode(news.currencyCode).makePretty(news.newsJson.addressAmount, 'appNewsActions.addressAmount')
                            news.newsJson.amountPretty = BlocksoftPrettyNumbers.makeCut(tmp).separated
                            news.newsJson.addressAmount = 1
                        } else if (typeof news.newsJson.balance !== 'undefined' && news.newsJson.balance !== '0' && news.newsJson.balance !== 0) {
                            const tmp = BlocksoftPrettyNumbers.setCurrencyCode(news.currencyCode).makePretty(news.newsJson.balance, 'appNewsActions.balance')
                            news.newsJson.amountPretty = BlocksoftPrettyNumbers.makeCut(tmp).separated
                            news.newsJson.balance = 1
                        }
                    }
                    await AppNotificationPopup.displayPushFromNews(news)
                    await appNewsDS.shownPopup(news.id)
                } else {
                    await appNewsDS.setNewsNeedPopup({ id: news.id, newsNeedPopup: 0 })
                }

            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('ACT/AppNewsActions error ' + e.message, e, news)
                }
                Log.daemon('ACT/AppNewsActions error ' + e.message)
            }
        }
    }

    export const clearAll = async (): Promise<void> => {
        await appNewsDS.clear()
        store.dispatch({
            type: 'SET_APP_NEWS_LIST',
            appNewsList: []
        })
        await AppNewsActions.displayBadge(0)
    }

    export const updateSettings = async (): Promise<void> => {
        const exchangeRatesNotifs = settingsActions.getSettingStatic('exchangeRatesNotifs')
        if (exchangeRatesNotifs !== '0') {
            // full reload
            return appNewsInitStore()
        }
        const news = store.getState().appNewsStore.appNewsList
        const sorted = []
        for (const item of news) {
            if (item.newsGroup !== 'RATES_CHANGING') {
                sorted.push(item)
            }
        }
        store.dispatch({
            type: 'SET_APP_NEWS_LIST',
            appNewsList: sorted
        })
    }

    export const markAsOpened = async (id: number, hasBadge : boolean): Promise<void> => {
        await appNewsDS.markAsOpened(id)
        store.dispatch({
            type: 'SET_APP_NEWS_OPENED_ONE',
            appNewsId : id,
            appNewsHasBadge : hasBadge
        })
        await AppNewsActions.displayBadge(CACHE_BADGE - 1)
    }

    export const markAllAsOpened = async (): Promise<void> => {
        await appNewsDS.markAllAsOpened()
        store.dispatch({
            type: 'SET_APP_NEWS_OPENED_ALL'
        })
    }
}
