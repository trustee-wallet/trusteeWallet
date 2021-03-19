
import Database from './main';


export async function cleanupNotNeeded() {
    const createdTs = new Date().getTime() - 480 * 3600000
    const createdAt = new Date(createdTs).toISOString() // 20 days
    
    await (Database.setQueryString(`UPDATE transactions SET transactions_scan_log='' WHERE created_at<'${createdAt}'`)).query()
    await (Database.setQueryString(`DELETE FROM app_news WHERE news_name='BTC_RATES_CHANGING' AND  news_created<${createdTs/1000}`)).query()
}
