import { AppNewsItem, AppNewsJson } from '../../appstores/Stores/AppNews/Types'

interface NotificationJsonLang {
    title: string
    description: string
}

export interface NotificationJson {
    ru: NotificationJsonLang,
    uk: NotificationJsonLang,
    en: NotificationJsonLang
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
