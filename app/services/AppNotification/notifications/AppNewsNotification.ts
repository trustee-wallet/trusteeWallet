import { AppNewsItem } from '../../../appstores/Stores/AppNews/Types'
import { LocalNotification } from '../Types'
import PrepareNotification from './BasicNotification'

import Log from '../../Log/Log'

export default new class AppNewsNotification extends PrepareNotification {
    constructor() {
        super()
        this.prepareOpenedNotification()
    }

    prepareOpenedNotification = async () => {
        try {
            const openedNotification = await this.getOpenedNotification()
        } catch (e) {
            if (e.message === 'Empty firebase.notification') {
                Log.log('PUSH AppNewsNotification prepareOpenedNotification notice ' + e.message)
            } else {
                Log.err('PUSH AppNewsNotification prepareOpenedNotification error ' + e.message)
            }
        }
    }

    prepareNotification = (appNews: AppNewsItem): LocalNotification => {
        this.notificationType = appNews.newsName
        this.notificationTexts = this.getTextsForNotification(appNews)

        return {
            notificationId: new Date().getTime().toString(),
            notificationTitle: this.notificationTexts.title,
            notificationSubtitle: this.notificationTexts.description,
            notificationBody: this.notificationTexts.description,
            notificationData: {
                notificationType: appNews.newsName,
                notificationJson: appNews,
            },
            notificationIosBadge: 0,
            notificationNeedPopup: appNews.newsNeedPopup
        }
    }
}
