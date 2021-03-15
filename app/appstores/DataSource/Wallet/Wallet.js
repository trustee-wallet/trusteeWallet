/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database';

import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'
import Log from '../../../services/Log/Log'
import CashBackUtils from '../../Stores/CashBack/CashBackUtils'
import DaemonCache from '../../../daemons/DaemonCache'

const CACHE = []

class Wallet {

    /**
     * @param {Object} wallet
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletCashback
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

        const tmpWalletName = Database.escapeString(wallet.walletName)
        const tmpWalletJSON = Database.escapeString(wallet.walletJson)

        const walletUseLegacy = 2
        const walletUseUnconfirmed = 1
        await Database.setQueryString(`INSERT INTO wallet (wallet_hash, wallet_name, wallet_json, wallet_is_hd, wallet_use_legacy, wallet_use_unconfirmed, wallet_allow_replace_by_fee, wallet_is_backed_up, wallet_is_hide_transaction_for_fee)
        VALUES ('${wallet.walletHash}', '${tmpWalletName}','${tmpWalletJSON}', 0, ${walletUseLegacy}, ${walletUseUnconfirmed}, 1, ${wallet.walletIsBackedUp || 0}, ${wallet.walletIsHideTransactionForFee || 1})`).query(true)
    }

    /**
     * @param {Object} wallet
     * @param {string} wallet.walletHash
     * @returns {Promise<void>}
     */
    clearWallet = async (wallet) => {
        Log.daemon('DS/Wallet clear wallet called ' + wallet.walletHash)
        const sql = `DELETE FROM wallet WHERE wallet_hash='${wallet.walletHash}'`
        await Database.setQueryString(sql).query()
        CACHE[wallet.walletHash] = false
        Log.daemon('DS/Wallet clear wallet finished ' + wallet.walletHash)
    }

    /**
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletCashback
     * @param {string} wallet.walletIsHd
     * @param {string} wallet.walletUseUnconfirmed
     * @param {string} wallet.walletUseLegacy
     * @param {string} wallet.walletAllowReplaceByFee
     * @param {string} wallet.walletIsBackedUp
     * @param {string} wallet.walletIsHideTransactionForFee
     */
    updateWallet = async (wallet) => {
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
        await Database.setQueryString(sql).query()
        CACHE[wallet.walletHash] = false
    }

    /**
     * @param {string} walletHash
     * @param {string} newWalletName
     */
    changeWalletName = async (walletHash, newWalletName) => {
        await Database.setQueryString(`UPDATE wallet SET wallet_name='${Database.escapeString(newWalletName)}' WHERE wallet_hash='${walletHash}'`).query()
        CACHE[walletHash] = false
    }

    /**
     * @returns {Promise<{id, walletHash, walletName, walletIsHd, walletIsBackedUp, walletUseUnconfirmed, walletIsHideTransactionForFee, walletAllowReplaceByFee}[]|*>}
     */
    getWallets = async () => {
        const res = await Database.setQueryString(`
                SELECT
                wallet_hash AS walletHash,
                wallet_cashback AS walletCashback,
                wallet_name AS walletName,
                wallet_is_hd AS walletIsHd,
                wallet_is_backed_up AS walletIsBackedUp,
                wallet_use_unconfirmed AS walletUseUnconfirmed,
                wallet_use_legacy AS walletUseLegacy,
                wallet_allow_replace_by_fee AS walletAllowReplaceByFee,
                wallet_is_hide_transaction_for_fee AS walletIsHideTransactionForFee
                FROM wallet`).query()
        if (!res || !res.array) {
            Log.log('DS/Wallet getWallets no result')
            return []
        }
        for (let i = 0, ic = res.array.length; i < ic; i++) {
            res.array[i] = this._prepWallet(res.array[i])
            this._redoCashback(res.array[i])
        }
        return res.array
    }

    async _redoCashback(wallet) {
        if (wallet.walletCashback && wallet.walletCashback !== '') {
            return wallet
        }
        const { cashbackToken } = await CashBackUtils.getByHash(wallet.walletHash, 'DS/Wallet getWallets redo')
        await Database.setQueryString(`UPDATE wallet SET wallet_cashback='${cashbackToken}' WHERE wallet_hash='${wallet.walletHash}'`).query()
        wallet.walletCashback = cashbackToken
        DaemonCache.CACHE_WALLET_NAMES_AND_CB[wallet.walletHash] = wallet
        return wallet
    }

    _prepWallet(wallet) {
        wallet.walletName = Database.unEscapeString(wallet.walletName)
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
        const res = await Database.setQueryString(`
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

        const res = await Database.setQueryString(`
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
