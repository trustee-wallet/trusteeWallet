
import Database from './main';
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'


export async function cleanupNotNeeded() {
    const createdTs = new Date().getTime() - 480 * 3600000
    const createdAt = new Date(createdTs).toISOString() // 20 days

    await Database.query(`UPDATE transactions SET transactions_scan_log='' WHERE created_at<'${createdAt}'`)

    await Database.query(`DELETE FROM app_task`)


    const exchangeRatesNotifs = settingsActions.getSettingStatic('exchangeRatesNotifs')
    if (exchangeRatesNotifs === '0') {
        await Database.query(`DELETE FROM app_news WHERE news_group='RATES_CHANGING'`)
    } else {
        await Database.query(`DELETE FROM app_news WHERE news_group='RATES_CHANGING' AND  news_created<${createdTs / 1000}`)
    }
}
