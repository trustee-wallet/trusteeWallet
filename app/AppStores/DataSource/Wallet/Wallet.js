/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'

import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'
import Log from '../../../services/Log/Log'

const CACHE = []

class Wallet {

    /**
     * @param {Object} wallet
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletName
     * @param {string} wallet.walletJson
     * @param {integer} wallet.walletIsBackedUp
     * @param {integer} wallet.walletIsHideTransactionForFee
     * @param {integer} wallet.walletAllowReplaceByFee
     */
    saveWallet = async (wallet) => {
        if (typeof wallet.walletHash === 'undefined') {
            throw new Error('DS/Wallet saveWallet walletHash is required')
        }

        const dbInterface = new DBInterface()
        const tmpWalletName = dbInterface.escapeString(wallet.walletName)
        const tmpWalletJSON = dbInterface.escapeString(wallet.walletJson)
        await dbInterface.setQueryString(`INSERT INTO wallet (wallet_hash, wallet_name, wallet_json, wallet_is_hd, wallet_use_legacy, wallet_use_unconfirmed, wallet_allow_replace_by_fee, wallet_is_backed_up, wallet_is_hide_transaction_for_fee) 
        VALUES ('${wallet.walletHash}', '${tmpWalletName}','${tmpWalletJSON}', 0, 0, 0, 0, ${wallet.walletIsBackedUp || 0}, ${wallet.walletIsHideTransactionForFee || 1})`).query(true)
    }

    /**
     * @param {Object} wallet
     * @param {string} wallet.walletHash
     * @returns {Promise<void>}
     */
    clearWallet = async (wallet) => {
        Log.daemon('DS/Wallet clear wallet called ' + wallet.walletHash)
        const dbInterface = new DBInterface()
        const sql = `DELETE FROM wallet WHERE wallet_hash='${wallet.walletHash}'`
        await dbInterface.setQueryString(sql).query()
        CACHE[wallet.walletHash] = false
        Log.daemon('DS/Wallet clear wallet finished ' + wallet.walletHash)
    }

    /**
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletIsHd
     * @param {string} wallet.walletUseUnconfirmed
     * @param {string} wallet.walletUseLegacy
     * @param {string} wallet.walletAllowReplaceByFee
     * @param {string} wallet.walletIsBackedUp
     * @param {string} wallet.walletIsHideTransactionForFee
     */
    updateWallet = async (wallet) => {
        const dbInterface = new DBInterface()
        let sql = ''
        if (typeof wallet.walletIsHd !== 'undefined') {
            sql = `UPDATE wallet SET wallet_is_hd='${wallet.walletIsHd ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`
        } else if (typeof wallet.walletIsBackedUp !== 'undefined') {
            sql = `UPDATE wallet SET wallet_is_backed_up='${wallet.walletIsBackedUp ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`
        } else if (typeof wallet.walletUseLegacy !== 'undefined') {
            sql = `UPDATE wallet SET wallet_use_legacy='${wallet.walletUseLegacy ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`
        } else if (typeof wallet.walletAllowReplaceByFee !== 'undefined') {
            sql = `UPDATE wallet SET wallet_allow_replace_by_fee='${wallet.walletAllowReplaceByFee ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`
        } else if (typeof wallet.walletIsHideTransactionForFee !== 'undefined') {
            sql = `UPDATE wallet SET wallet_is_hide_transaction_for_fee='${wallet.walletIsHideTransactionForFee ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`
        } else if (typeof wallet.walletUseUnconfirmed !== 'undefined') {
            sql = `UPDATE wallet SET wallet_use_unconfirmed='${wallet.walletUseUnconfirmed ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`
        } else {
            throw new Error('could not update ' + JSON.stringify(wallet))
        }
        await dbInterface.setQueryString(sql).query()
        CACHE[wallet.walletHash] = false
    }

    /**
     * @param {string} walletHash
     * @param {string} newWalletName
     */
    changeWalletName = async (walletHash, newWalletName) => {
        const dbInterface = new DBInterface()
        await dbInterface.setQueryString(`UPDATE wallet SET wallet_name='${newWalletName}' WHERE wallet_hash='${walletHash}'`).query()
    }

    /**
     * @returns {Promise<{id, walletHash, walletName, walletIsHd, walletIsBackedUp, walletUseUnconfirmed, walletIsHideTransactionForFee, walletAllowReplaceByFee}[]|*>}
     */
    getWallets = async () => {
        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`
                SELECT
                wallet_hash AS walletHash,
                wallet_name AS walletName,
                wallet_is_hd AS walletIsHd,
                wallet_is_backed_up AS walletIsBackedUp,
                wallet_use_unconfirmed AS walletUseUnconfirmed,
                wallet_use_legacy AS walletUseLegacy,
                wallet_allow_replace_by_fee AS walletAllowReplaceByFee,
                wallet_is_hide_transaction_for_fee AS walletIsHideTransactionForFee
                FROM wallet`).query()
        if (!res || !res.array) return res
        for (let i = 0, ic = res.array.length; i < ic; i++) {
            res.array[i] = this._prepWallet(res.array[i])

        }
        return res.array
    }

    _prepWallet(wallet) {
        const dbInterface = new DBInterface()
        wallet.walletName = dbInterface.unEscapeString(wallet.walletName)
        wallet.walletIsHd = wallet.walletIsHd * 1 || 0
        wallet.walletIsBackedUp = wallet.walletIsBackedUp * 1 || 0
        wallet.walletUseUnconfirmed = wallet.walletUseUnconfirmed * 1 || 0
        wallet.walletUseLegacy = wallet.walletUseLegacy * 1 || 0
        wallet.walletAllowReplaceByFee = wallet.walletAllowReplaceByFee * 1 || 0
        wallet.walletIsHideTransactionForFee = wallet.walletIsHideTransactionForFee * 1 || 0
        return wallet
    }

    /**
     * @returns {Promise<string>}
     */
    hasWallet = async () => {
        const dbInterface = new DBInterface()
        const res = await dbInterface.setQueryString(`
                SELECT 
                wallet_hash 
                FROM wallet LIMIT 1`).query()
        return res && res.array && res.array[0]
    }

    /**
     * @param walletHash
     * @returns {Promise<boolean|{walletName, walletIsHd, walletUseUnconfirmed, walletAllowReplaceByFee}>}
     */
    getWalletByHash = async (walletHash) => {
        if (typeof CACHE[walletHash] !== 'undefined' && CACHE[walletHash]) {
            return CACHE[walletHash]
        }

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`
                SELECT
                wallet_hash AS walletHash,
                wallet_name AS walletName,
                wallet_is_hd AS walletIsHd,
                wallet_is_backed_up AS walletIsBackedUp,
                wallet_use_unconfirmed AS walletUseUnconfirmed,
                wallet_use_legacy AS walletUseLegacy,
                wallet_allow_replace_by_fee AS walletAllowReplaceByFee,
                wallet_is_hide_transaction_for_fee AS walletIsHideTransactionForFee
                FROM wallet WHERE wallet_hash='${walletHash}' LIMIT 1`).query()
        if (!res || !res.array || res.array.length === 0) return false

        const wallet = this._prepWallet(res.array[0])
        CACHE[walletHash] = wallet
        return wallet
    }

    /**
     * @param {string} mnemonic
     * @returns {Promise<boolean>}
     */
    walletExist = async (mnemonic) => {
        mnemonic = BlocksoftKeysUtils.recheckMnemonic(mnemonic)

        const walletHash = await BlocksoftKeysUtils.hashMnemonic(mnemonic)

        const res = await this.getWalletByHash(walletHash)

        return typeof res !== 'undefined' && res !== false
    }
}

export default new Wallet()
