/**
 * @version 0.30
 */
import appNewsDS from '../../DataSource/AppNews/AppNews'
import Log from '../../../services/Log/Log'

import { AppNewsItem } from './Types'

import UpdateAppNewsListDaemon from '../../../daemons/view/UpdateAppNewsListDaemon'
import config from '../../../config/config'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import AppNotificationPopup from '../../../services/AppNotification/AppNotificationPopup'
import NavStore from '../../../components/navigation/NavStore'
import { strings } from '../../../services/i18n'
import { showModal } from '../Modal/ModalActions'
import MarketingEvent from '../../../services/Marketing/MarketingEvent'
import lockScreenAction from '../LockScreen/LockScreenActions'

import settingsActions from '../../../appstores/Stores/Settings/SettingsActions'
import AppNotificationListener from '../../../services/AppNotification/AppNotificationListener'

export namespace AppNewsActions {

    /**
     * @param notification
     * @param title
     * @param subtitle
     * return true when NavStore need to be called outside the function (to reload notifications screen if called from local push open etc)
     */
    export const onOpen = async (notification : any, title : string = '', subtitle : string = '', checkLock = true): Promise<boolean> => {
        if (checkLock && MarketingEvent.UI_DATA.IS_LOCKED) {
            await Log.log('ACT/AppNewsActions onOpen need unlock')
            lockScreenAction.setFlowType({
                flowType: 'JUST_CALLBACK'
            })
            lockScreenAction.setActionCallback({
                actionCallback: async () => {
                    await Log.log('ACT/AppNewsActions onOpen after lock screen')
                    if (await AppNewsActions.onOpen(notification, title, subtitle, false)) {
                        NavStore.reset('NotificationsScreen')
                    }
                }
            })
            NavStore.reset('LockScreen')
            return false
        }

        await Log.log('ACT/AppNewsActions onOpen', notification)
        if (notification.newsOpenedAt === null) {
            await AppNewsActions.markAsOpened(notification.id)
        }
        if (notification.newsUrl && notification.newsUrl !== 'null' && notification.newsUrl !== '') {
            NavStore.goNext('WebViewScreen', { url: notification.newsUrl, title: strings('notifications.newsTitle') })
            return false
        }

        // orders processing
        const transactionHash = notification.newsJson?.payinTxHash || notification.newsJson?.payoutTxHash
        const orderHash = notification.newsJson?.orderHash || false
        if (title === '') {
            title = notification?.newsCustomTitle || false
        }
        if (subtitle === '') {
            subtitle = notification?.newsCustomText || false
        }

        const notificationToTx = {title, subtitle, newsName: notification.newsName, createdAt : notification.newsCreated}
        if (transactionHash) {
            NavStore.goNext('TransactionScreen', {
                txData: {
                    transactionHash,
                    orderHash,
                    walletHash : notification.walletHash,
                    notification : notificationToTx
                }
            })
            return false
        } else if (orderHash) {
            NavStore.goNext('TransactionScreen', {
                txData: {
                    orderHash,
                    walletHash : notification.walletHash,
                    notification : notificationToTx
                }
            })
            return false
        } else {
            const exchangeRatesNotifs = await settingsActions.getSetting('exchangeRatesNotifs')
            showModal({
                type: 'NOTIFICATION_MODAL',
                // title: title,
                description: subtitle ? subtitle : title ? title : '',
                rates: +exchangeRatesNotifs && notification.newsGroup === "RATES_CHANGING",
                noCallback: async () => {
                    await settingsActions.setSettings('exchangeRatesNotifs', '0')
                    await AppNotificationListener.updateSubscriptionsLater()
                }
            })
            return true
        }
    }

    export const displayBadge = async (number:number) : Promise<void> => {
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
        // @ts-ignore
        await UpdateAppNewsListDaemon.forceDaemonUpdate()
    }

    export const markAsOpened = async (id : number): Promise<void> => {
        await appNewsDS.markAsOpened(id)
        // @ts-ignore
        await UpdateAppNewsListDaemon.forceDaemonUpdate()
    }

    export const markAllAsOpened = async (): Promise<void> => {
        await appNewsDS.markAllAsOpened()
        // @ts-ignore
        await UpdateAppNewsListDaemon.forceDaemonUpdate()
    }

    export const markAsRemoved = async (id : number): Promise<void> => {
        await appNewsDS.setRemoved({id})
        // @ts-ignore
        await UpdateAppNewsListDaemon.forceDaemonUpdate()
    }
}
