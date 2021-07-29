/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';
import Log from '../../../services/Log/Log'
import BlocksoftFixBalance from '../../../../crypto/common/BlocksoftFixBalance'

export default {

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @param {boolean} params.force
     * @return {Promise<{id, currencyCode, walletPubType, walletPubValue, transactionsScanTime, balance, balanceFix, balanceTxt, balanceProvider, balanceScanTime, balanceScanLog}[]>}
     */
    getWalletPubsForScan: async (params) => {
        Log.daemon('WalletPubScanning getWalletPubsForScan called')

        let where = []
        if (typeof params.force === 'undefined' || !params.force) {
            const now = Math.round(new Date().getTime() / 1000) - 60 // 1 minute before
            where.push(`(wallet_pub.balance_scan_time IS NULL OR wallet_pub.balance_scan_time < ${now} OR wallet_pub.transactions_scan_time IS NULL OR wallet_pub.transactions_scan_time < ${now})`)
        }
        if (params.walletHash) {
            where.push(`wallet_pub.wallet_hash='${params.walletHash}'`)
        }

        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const sql = `
            SELECT
            wallet_pub.id,
            wallet_pub.currency_code AS currencyCode,
            wallet_pub.wallet_hash AS walletHash,
            wallet_pub.wallet_pub_type AS walletPubType,
            wallet_pub.wallet_pub_value AS walletPubValue,

            wallet_pub.transactions_scan_time AS transactionsScanTime,

            wallet_pub.balance_fix AS balanceFix,
            wallet_pub.balance_txt AS balanceTxt,
            wallet_pub.unconfirmed_fix AS unconfirmedFix,
            wallet_pub.unconfirmed_txt AS unconfirmedTxt,

            wallet_pub.balance_provider AS balanceProvider,
            wallet_pub.balance_scan_time AS balanceScanTime,
            wallet_pub.balance_scan_error AS balanceScanError,
            wallet_pub.balance_scan_log AS balanceScanLog,
            wallet_pub.balance_scan_block AS balanceScanBlock

            FROM wallet_pub
            ${where}
            ORDER BY wallet_pub.balance_scan_time ASC
            LIMIT 20
        `
        let res = []
        const unique = {}
        try {
            res = await Database.query(sql)
            if (!res || typeof res.array === 'undefined' || !res.array || !res.array.length) {
                Log.daemon('WalletPubScanning getWalletPubsForScan finished as empty')
                return false
            }
            res = res.array
            for (let i = 0, ic = res.length; i < ic; i++) {
                const key = res[i].walletHash + '_' + res[i].walletPubType
                if (typeof unique[key] === 'undefined') {
                    res[i].balance = BlocksoftFixBalance(res[i], 'balance')
                    res[i].unconfirmed = BlocksoftFixBalance(res[i], 'unconfirmed')
                    res[i].balanceScanBlock = typeof res[i].balanceScanBlock !== 'undefined' ? (res[i].balanceScanBlock * 1) : 0
                    res[i].balanceScanLog = res[i].balanceScanLog || ''
                    res[i].transactionsScanLog = res[i].transactionsScanLog || ''
                    unique[key] = 1
                }
            }
            Log.daemon('DS/WalletPubScanning getWalletPubsForScan finished')
        } catch (e) {
            Log.daemon('DS/WalletPubScanning getWalletPubsForScan error ' + sql + ' ' + e.message)
        }
        return res
    },

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} walletPub
     * @param {string} walletPub.id
     * @param {string} walletPub.currencyCode
     * @param {string} walletPub.walletHash
     * @return {Promise<void>}
     */
    updateBalance: async (data, walletPub) => {
        Log.daemon('DS/WalletPub updateBalance called')
        if (data.updateObj.balanceScanLog.length > 1000) {
            data.updateObj.balanceScanLog = data.updateObj.balanceScanLog.substr(0,1000)
        }
        data.updateObj.balanceScanLog = Database.escapeString(data.updateObj.balanceScanLog)
        data.key = { id: walletPub.id }
        await Database.setTableName('wallet_pub').setUpdateData(data).update()
        Log.daemon('DS/WalletPub updateBalance finished')
    },

    /**
     * @param {Object} data
     * @param {Object} data.updateObj
     * @param {Object} walletPub
     * @param {string} walletPub.id
     * @param {string} walletPub.currencyCode
     * @param {string} walletPub.walletHash
     * @return {Promise<void>}
     */
    updateTransactions: async (data, walletPub) => {
        Log.daemon('DS/WalletPub updateTransactions called')
        if (data.updateObj.transactionsScanLog.length > 1000) {
            data.updateObj.transactionsScanLog = data.updateObj.transactionsScanLog.substr(0, 1000)
        }
        data.updateObj.transactionsScanLog = Database.escapeString(data.updateObj.transactionsScanLog)
        data.key = { id: walletPub.id }
        await Database.setTableName('wallet_pub').setUpdateData(data).update()
        Log.daemon('DS/WalletPub updateTransactions finished')
    }
}
