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
     */
    saveWallet = async (wallet) => {
        if (typeof wallet.walletHash === 'undefined') {
            throw new Error('DS/Wallet saveWallet walletHash is required')
        }

        const dbInterface = new DBInterface()
        const tmpWalletName = dbInterface.escapeString(wallet.walletName)
        const tmpWalletJSON = dbInterface.escapeString(wallet.walletJson)
        await dbInterface.setQueryString(`INSERT INTO wallet (wallet_hash, wallet_name, wallet_json, wallet_is_hd, wallet_use_legacy, wallet_use_unconfirmed, wallet_is_backed_up, wallet_is_hide_transaction_for_fee) 
        VALUES ('${wallet.walletHash}', '${tmpWalletName}','${tmpWalletJSON}', 0, 0, 0, ${wallet.walletIsBackedUp || 0}, ${wallet.walletIsHideTransactionForFee || 1})`).query(true)
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
     * @param {string} wallet.walletIsBackedUp
     */
    updateWallet = async (wallet) => {
        const dbInterface = new DBInterface()
        if (typeof wallet.walletIsHd !== 'undefined') {
            await dbInterface.setQueryString(`UPDATE wallet SET wallet_is_hd='${wallet.walletIsHd ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`).query()
        } else if (typeof wallet.walletIsBackedUp !== 'undefined') {
            await dbInterface.setQueryString(`UPDATE wallet SET wallet_is_backed_up='${wallet.walletIsBackedUp ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`).query()
        } else if (typeof wallet.walletUseLegacy !== 'undefined') {
            await dbInterface.setQueryString(`UPDATE wallet SET wallet_use_legacy='${wallet.walletUseLegacy ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`).query()
        } else {
            await dbInterface.setQueryString(`UPDATE wallet SET wallet_use_unconfirmed='${wallet.walletUseUnconfirmed ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`).query()
        }
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
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletIsHideTransactionForFee
     */
    toggleWalletIsHideTransactionForFee = async (wallet) => {
        const dbInterface = new DBInterface()

        let tmp = 0
        if (wallet.walletIsHideTransactionForFee === null) {
            tmp = 1
        } else if (wallet.walletIsHideTransactionForFee === 1) {
            tmp = 0
        } else if (wallet.walletIsHideTransactionForFee === 0) {
            tmp = 1
        }

        await dbInterface.setQueryString(`UPDATE wallet SET wallet_is_hide_transaction_for_fee=${tmp} WHERE wallet_hash='${wallet.walletHash}'`).query()
    }

    /**
     * @returns {Promise<{id, walletHash, walletName, walletIsHd, walletIsBackedUp, walletUseUnconfirmed, walletIsHideTransactionForFee}[]|*>}
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
                wallet_is_hide_transaction_for_fee AS walletIsHideTransactionForFee
                FROM wallet`).query()
        if (!res || !res.array) return res
        for (let i = 0, ic = res.array.length; i < ic; i++) {
            res.array[i].walletName = dbInterface.unEscapeString(res.array[i].walletName)
        }
        return res.array
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
     * @returns {Promise<boolean|{walletName, walletIsHd, walletUseUnconfirmed}>}
     */
    getWalletByHash = async (walletHash) => {
        if (typeof CACHE[walletHash] !== 'undefined' && CACHE[walletHash]) {
            return CACHE[walletHash]
        }

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`
                SELECT
                wallet_name AS walletName,
                wallet_is_hd AS walletIsHd,
                wallet_use_unconfirmed AS walletUseUnconfirmed,
                wallet_use_legacy AS walletUseLegacy
                FROM wallet WHERE wallet_hash='${walletHash}' LIMIT 1`).query()
        if (!res || !res.array || res.array.length === 0) return false

        const wallet = res.array[0]
        wallet.walletName = dbInterface.unEscapeString(wallet.walletName)
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
