import { AppNewsItem, AppNewsJson } from '../../appstores/Stores/AppNews/Types'

export interface NotificationUnified {
    walletHash : string,
    newsSource: string,
    newsGroup: string,
    newsName: string,
    newsCustomTitle: string,
    newsCustomText: string,
    newsNeedPopup: number,
    newsServerId: string,
    newsJson : {
        notification?: any,
        inCurrencyCode?: string,
        en ?: {
            title : string,
            description : string,
        },
        ru ?: {
            title : string,
            description : string,
        },
        ua ?: {
            title : string,
            description : string,
        }
    }
}

export interface NotificationData {
    notificationType: string,
    notificationJson: AppNewsItem
}

export interface LocalNotification {
    notificationId: string,
    notificationTitle: string,
    notificationSubtitle: string,
    notificationBody: string,
    notificationData: NotificationData,
    notificationIosBadge: number,
    notificationNeedPopup: number,
}

export interface NotificationTexts {
    title: string,
    description: string
}
