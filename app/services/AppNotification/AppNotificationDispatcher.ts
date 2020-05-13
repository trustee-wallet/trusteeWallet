import { AppNewsItem, FOUND_IN_TX, FOUND_OUT_TX_STATUS_FAIL, FOUND_OUT_TX_STATUS_CONFIRMING, FOUND_OUT_TX_STATUS_DELEGATED, FOUND_OUT_TX_STATUS_SUCCESS } from '../../appstores/Stores/AppNews/Types'
import AppNewsNotification from './notifications/AppNewsNotification'


export default class AppNotificationDispatcher {

    private appNews: AppNewsItem

    constructor(appNews: AppNewsItem) {
        this.appNews = appNews
    }

    getNotificationProcessor = (): any => {
        switch(this.appNews.newsName) {
            case FOUND_IN_TX:
            case FOUND_OUT_TX_STATUS_FAIL:
            case FOUND_OUT_TX_STATUS_CONFIRMING:
            case FOUND_OUT_TX_STATUS_SUCCESS:
            case FOUND_OUT_TX_STATUS_DELEGATED:
                return AppNewsNotification
            default:
                throw new Error('Not supported type in AppNotificationDispatcher ' + this.appNews.newsName)
        }
    }

}
