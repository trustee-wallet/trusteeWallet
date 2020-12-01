import appNewsDS from '../../DataSource/AppNews/AppNews'
import Log from '../../../services/Log/Log'

import { AppNewsItem } from './Types'
import AppNotification from '../../../services/AppNotification/AppNotification'
import UpdateAppNewsListDaemon from '../../../daemons/view/UpdateAppNewsListDaemon'
import config from '../../../config/config'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

export default {
    displayPush: async (appNewsList: Array<AppNewsItem>): Promise<void> => {

        if (!appNewsList) return

        const unique = {}
        for (const news of appNewsList) {
            try {
                const key = typeof news.newsJson.transactionHash !== 'undefined' ? news.newsJson.transactionHash : news.newsJson
                // @ts-ignore
                if (typeof unique[key] === 'undefined') {
                    // @ts-ignore
                    unique[key] = 1
                    // somehow here its not breaking - but later is breaking android with 280000000000000000000000 values
                    if (typeof news.newsJson !== 'undefined') {
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
                    await new AppNotification(news).displayPush()
                } else {
                    await appNewsDS.setNewsNeedPopup(news.id, 0)
                }

            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('ACT/AppNewsActions error ' + e.message, news)
                }
                Log.daemon('ACT/AppNewsActions error ' + e.message)
            }
        }
    },

    clearAll: async (): Promise<void> => {
        await appNewsDS.clear()
        // @ts-ignore
        await UpdateAppNewsListDaemon.forceDaemonUpdate()
    }
}
