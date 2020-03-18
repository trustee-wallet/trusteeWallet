import DBInterface from '../DB/DBInterface'

import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'
import Log from '../../../services/Log/Log'

const CACHE = []

class Wallet {

    /**
     * @param {string} walletHash
     * @param {string} walletName
     * @param {string} walletJSON
     * @param {integer} walletIsBackedUp
     */
    saveWallet = async (walletHash, walletName, walletJSON, walletIsBackedUp = 0) => {
        const dbInterface = new DBInterface()

        const tmpWalletName = dbInterface.escapeString(walletName)
        const tmpWalletJSON = dbInterface.escapeString(walletJSON)
        await dbInterface.setQueryString(`INSERT INTO wallet (wallet_hash, wallet_name, wallet_json, wallet_is_hd, wallet_use_unconfirmed, wallet_is_backed_up) 
        VALUES ('${walletHash}', '${tmpWalletName}','${tmpWalletJSON}', 0, 0, ${walletIsBackedUp})`).query(true)
    }

    /**
     * @param {string} params.walletHash
     * @returns {Promise<void>}
     */
    clearWallet = async (params) => {
        Log.daemon('DS/Wallet clear wallet called ' + params.walletHash)
        const dbInterface = new DBInterface()
        const sql = `DELETE FROM wallet WHERE wallet_hash='${params.walletHash}'`
        await dbInterface.setQueryString(sql).query()
        CACHE[params.walletHash] = false
        Log.daemon('DS/Wallet clear wallet finished ' + params.walletHash)
    }

    /**
     * @param {string} wallet.walletHash
     * @param {string} wallet.walletIsHd
     * @param {string} wallet.walletUseUnconfirmed
     */
    updateWallet = async (wallet) => {
        const dbInterface = new DBInterface()
        if (typeof wallet.walletIsHd !== 'undefined') {
            await dbInterface.setQueryString(`UPDATE wallet SET wallet_is_hd='${wallet.walletIsHd ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`).query()
        } else {
            await dbInterface.setQueryString(`UPDATE wallet SET wallet_use_unconfirmed='${wallet.walletUseUnconfirmed ? 1 : 0}' WHERE wallet_hash='${wallet.walletHash}'`).query()
        }
        CACHE[wallet.walletHash] = false
    }

    getWallets = async () => {
        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM wallet`).query()
        if (!res || !res.array) return res
        for (let i = 0, ic = res.array.length; i<ic; i++) {
            res.array[i].wallet_name = dbInterface.unEscapeString(res.array[i].wallet_name)
        }
        return res
    }

    hasWallet = async () => {
        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT wallet_hash FROM wallet LIMIT 1`).query()
        return res && res.array && res.array[0]
    }

    /**
     * @param walletHash
     * @returns {Promise<boolean|{wallet_name, wallet_is_hd, wallet_use_unconfirmed}>}
     */
    getWalletByHash = async (walletHash) => {
        if (typeof CACHE[walletHash] !== 'undefined' && CACHE[walletHash]) {
            return CACHE[walletHash]
        }

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM wallet WHERE wallet_hash='${walletHash}' LIMIT 1`).query()
        if (!res || !res.array || res.array.length === 0) return false

        const wallet = res.array[0]
        wallet.wallet_name = dbInterface.unEscapeString(wallet.wallet_name)
        CACHE[walletHash] = wallet
        return wallet
    }

    walletExist = async (mnemonic) => {
        mnemonic = BlocksoftKeysUtils.recheckMnemonic(mnemonic)

        const walletHash = await BlocksoftKeysUtils.hashMnemonic(mnemonic)

        const result = await this.getWalletByHash(walletHash)

        return typeof result !== 'undefined' && result !== false
    }

    changeWalletBackedUpStatus = async (data) => {
        try {
            const dbInterface = new DBInterface()

            await dbInterface.setTableName('wallet').setUpdateData(data).update()

        } catch (e) {
            Log.err('WalletDS.changeWalletBackedUpStatus error ' + e)
        }
    }

}

export default new Wallet()
