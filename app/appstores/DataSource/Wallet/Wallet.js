/**
 * @version 0.77
 */
import Database from '@app/appstores/DataSource/Database'

import BlocksoftKeysUtils from '@crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import UpdateWalletsDaemon from '@app/daemons/back/UpdateWalletsDaemon'

import store from '@app/store'
import Validator from '@app/services/UI/Validator/Validator'


const CACHE = []

class Wallet {

    /**
     * @param {Object} wallet
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletCashback
     * @param {string} wallet.walletName
     * @param {integer} wallet.walletIsBackedUp
     * @param {integer} wallet.walletIsHideTransactionForFee
     * @param {integer} wallet.walletAllowReplaceByFee
     * @param {integer} wallet.walletUseLegacy
     * @param {integer} wallet.walletUseUnconfirmed
     * @param {integer} wallet.walletIsHd
     * @param {integer} wallet.walletIsCreatedHere
     */
    saveWallet = async (wallet) => {
        if (typeof wallet.walletHash === 'undefined') {
            throw new Error('DS/Wallet saveWallet walletHash is required')
        }

        let walletNumber = 0
        if (typeof wallet.walletNumber !== 'undefined' && wallet.walletNumber && wallet.walletNumber * 1 > 0) {
            walletNumber = wallet.walletNumber * 1
        }
        let walletIsCreatedHere = 0
        if (typeof wallet.walletIsCreatedHere !== 'undefined' && wallet.walletIsCreatedHere && wallet.walletIsCreatedHere * 1 > 0) {
            walletIsCreatedHere = wallet.walletIsCreatedHere * 1
        }
        const tmpWalletName = Database.escapeString(wallet.walletName)
        const recheck = await Database.query(`SELECT wallet_name FROM wallet WHERE wallet_hash='${wallet.walletHash}'`)
        if (recheck && recheck.array && recheck.array.length > 0) {
            return true
        }
        const sql = `INSERT INTO wallet (
        wallet_to_send_status, wallet_hash, wallet_name, 
        wallet_is_hd, wallet_use_legacy, wallet_use_unconfirmed, 
        wallet_allow_replace_by_fee, wallet_is_backed_up, wallet_is_hide_transaction_for_fee, 
        wallet_number, wallet_is_created_here)
        VALUES (
        ${wallet.walletToSendStatus || 0}, '${wallet.walletHash}', '${tmpWalletName}', 
        ${wallet.walletIsHd || 0}, ${wallet.walletUseLegacy || 2}, ${wallet.walletUseUnconfirmed || 1}, 
        ${wallet.walletAllowReplaceByFee || 1}, ${wallet.walletIsBackedUp || 0}, ${wallet.walletIsHideTransactionForFee || 1},
        ${walletNumber}, ${walletIsCreatedHere}
        )`
        await Database.query(sql, true)
    }

    /**
     * @param {Object} wallet
     * @param {string} wallet.walletHash
     * @returns {Promise<void>}
     */
    clearWallet = async (wallet) => {
        const sql = `DELETE FROM wallet WHERE wallet_hash='${wallet.walletHash}'`
        await Database.query(sql)
        CACHE[wallet.walletHash] = false
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
     * @param {string} wallet.key.walletHash
     * @param {string} wallet.updateObj
     */
    updateWallet = async (wallet) => {
        let updateObj = {}
        let walletHash = false
        if (typeof wallet.updateObj !== 'undefined') {
            // full update object
            await Database.setTableName('wallet').setUpdateData(wallet).update()
            walletHash = wallet.key.walletHash
            updateObj = wallet.updateObj
        } else {
            walletHash = wallet.walletHash
            updateObj = {
                walletToSendStatus: Math.round(new Date().getTime() / 1000)
            }
            if (typeof wallet.walletIsHd !== 'undefined') {
                updateObj.walletIsHd = wallet.walletIsHd ? 1 : 0
            } else if (typeof wallet.walletIsBackedUp !== 'undefined') {
                updateObj.walletIsBackedUp = wallet.walletIsBackedUp ? 1 : 0
            } else if (typeof wallet.walletUseLegacy !== 'undefined') {
                updateObj.walletUseLegacy = wallet.walletUseLegacy ? 1 : 0
            } else if (typeof wallet.walletAllowReplaceByFee !== 'undefined') {
                updateObj.walletAllowReplaceByFee = wallet.walletAllowReplaceByFee ? 1 : 0
            } else if (typeof wallet.walletIsHideTransactionForFee !== 'undefined') {
                updateObj.walletIsHideTransactionForFee = wallet.walletIsHideTransactionForFee ? 1 : 0
            } else if (typeof wallet.walletUseUnconfirmed !== 'undefined') {
                updateObj.walletUseUnconfirmed = wallet.walletUseUnconfirmed ? 1 : 0
            } else if (typeof wallet.walletName !== 'undefined') {
                updateObj.walletName = Database.escapeString(wallet.walletName)
            } else {
                throw new Error('could not update ' + JSON.stringify(wallet))
            }
            await Database.setTableName('wallet').setUpdateData({
                key: {
                    walletHash
                },
                updateObj
            }).update()
        }

        let selectedWallet = store.getState().mainStore.selectedWallet
        if (selectedWallet.walletHash === walletHash) {
            let changed = false
            for (const key in updateObj) {
                let newVal = updateObj[key]
                if (key === 'walletName') {
                    newVal = Database.unEscapeString(updateObj[key])
                }
                if (newVal !== selectedWallet[key]) {
                    selectedWallet[key] = newVal
                    changed = true
                }
            }
            if (changed) {
                store.dispatch({
                    type: 'SET_SELECTED_WALLET',
                    wallet: selectedWallet
                })
                UpdateWalletsDaemon.updateWalletsDaemon({ force: true })
            }
        }


        const selectedWallets = store.getState().walletStore.wallets
        for (selectedWallet of selectedWallets) {
            if (selectedWallet.walletHash === walletHash) {
                let changed = false
                for (const key in updateObj) {
                    let newVal = updateObj[key]
                    if (key === 'walletName') {
                        newVal = Database.unEscapeString(updateObj[key])
                    }
                    if (newVal !== selectedWallet[key]) {
                        selectedWallet[key] = newVal
                        changed = true
                    }
                }
                if (changed) {
                    store.dispatch({
                        type: 'SET_WALLET_LIST',
                        wallets: selectedWallets
                    })
                }
            }
        }

        CACHE[wallet.walletHash] = false
    }

    /**
     * @returns {Promise<{id, walletHash, walletName, walletIsHd, walletIsBackedUp, walletUseUnconfirmed, walletIsHideTransactionForFee, walletAllowReplaceByFee}[]|*>}
     */
    getWallets = async () => {
        const res = await Database.query(`
                SELECT
                wallet_to_send_status AS walletToSendStatus,
                wallet_hash AS walletHash,
                wallet_cashback AS walletCashback,
                wallet_name AS walletName,
                wallet_is_hd AS walletIsHd,
                wallet_is_backed_up AS walletIsBackedUp,
                wallet_use_unconfirmed AS walletUseUnconfirmed,
                wallet_use_legacy AS walletUseLegacy,
                wallet_allow_replace_by_fee AS walletAllowReplaceByFee,
                wallet_is_hide_transaction_for_fee AS walletIsHideTransactionForFee,
                wallet_number AS walletNumber,
                wallet_is_created_here AS walletIsCreatedHere
                FROM wallet ORDER BY wallet_number`)
        if (!res || !res.array) {
            return []
        }
        for (let i = 0, ic = res.array.length; i < ic; i++) {
            res.array[i] = this._prepWallet(res.array[i])
            res.array[i] = await this._redoCashback(res.array[i])
        }
        return res.array
    }

    async _redoCashback(wallet) {
        if (wallet.walletCashback && wallet.walletCashback !== '' && wallet.walletCashback !== 'null') {
            return wallet
        }
        const { cashbackToken } = await CashBackUtils.getByHash(wallet.walletHash, 'DS/Wallet getWallets redo')
        await Database.query(`UPDATE wallet SET wallet_cashback='${cashbackToken}' WHERE wallet_hash='${wallet.walletHash}'`)
        wallet.walletCashback = cashbackToken
        return wallet
    }

    _prepWallet(wallet) {
        wallet.walletToSendStatus = wallet.walletToSendStatus * 1
        wallet.walletName = Database.unEscapeString(wallet.walletName)
        const safeName = Validator.safeWords(wallet.walletName, 10)
        if (wallet.walletName !== safeName) {
            Database.query(`UPDATE wallet SET wallet_name='${Database.escapeString(safeName)}' WHERE wallet_hash='${wallet.walletHash}'`)
        }
        wallet.walletNumber = wallet.walletNumber * 1 || 1
        wallet.walletIsHd = wallet.walletIsHd * 1 || 0
        if (typeof wallet.walletIsBackedUp !== 'undefined') {
            wallet.walletIsBackedUp = wallet.walletIsBackedUp * 1 || 0
        }
        wallet.walletUseUnconfirmed = wallet.walletUseUnconfirmed * 1 || 0
        wallet.walletUseLegacy = wallet.walletUseLegacy * 1 || 0
        wallet.walletAllowReplaceByFee = wallet.walletAllowReplaceByFee * 1 || 0
        wallet.walletIsHideTransactionForFee = wallet.walletIsHideTransactionForFee * 1 || 0
        wallet.walletIsCreatedHere = wallet.walletIsCreatedHere * 1 || 0
        return wallet
    }

    /**
     * @returns {Promise<string>}
     */
    hasWallet = async () => {
        try {
            let res = await Database.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='wallet'`)
            if (res && typeof res.array !== 'undefined' && res.array.length !== 0) {
                res = await Database.query(`SELECT wallet_hash FROM wallet LIMIT 1`)
                return res && res.array && res.array[0]
            }
            await Database.reInit()
            return false
        } catch (e) {
            return false
        }
    }

    /**
     * @param walletHash
     * @returns {Promise<boolean|{walletName, walletIsHd, walletUseUnconfirmed, walletAllowReplaceByFee}>}
     */
    getWalletByHash = async (walletHash) => {
        if (typeof CACHE[walletHash] !== 'undefined' && CACHE[walletHash]) {
            return CACHE[walletHash]
        }

        const res = await Database.query(`
                SELECT
                wallet_to_send_status AS walletToSendStatus,
                wallet_hash AS walletHash,
                wallet_cashback AS walletCashback,
                wallet_name AS walletName,
                wallet_is_hd AS walletIsHd,
                wallet_is_backed_up AS walletIsBackedUp,
                wallet_use_unconfirmed AS walletUseUnconfirmed,
                wallet_use_legacy AS walletUseLegacy,
                wallet_allow_replace_by_fee AS walletAllowReplaceByFee,
                wallet_is_hide_transaction_for_fee AS walletIsHideTransactionForFee,
                wallet_number AS walletNumber,
                wallet_is_created_here AS walletIsCreatedHere
                FROM wallet WHERE wallet_hash='${walletHash}' LIMIT 1`)
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
