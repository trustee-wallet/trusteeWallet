import DBInterface from '../DB/DBInterface'

import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'
import Log from '../../../services/Log/Log'

class Wallet {

    /**
     * @param {string} walletHash
     * @param {string} walletName
     */
    saveWallet = async (walletHash, walletName, walletJSON) => {
        const dbInterface = new DBInterface()

        const tmpWalletName = dbInterface.escapeString(walletName)
        const tmpWalletJSON = dbInterface.escapeString(walletJSON)

        await dbInterface.setQueryString(`INSERT INTO wallet (wallet_hash, wallet_name, wallet_json) VALUES ('${walletHash}', '${tmpWalletName}','${tmpWalletJSON}')`).query()
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
        return (res && res.array && res.array[0]) ? true : false
    }

    getWalletByHash = async (walletHash) => {
        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`SELECT * FROM wallet WHERE wallet_hash='${walletHash}' LIMIT 1`).query()

        if (res && res.array && res.array.length) {
            res.array[0].wallet_name = dbInterface.unEscapeString(res.array[0].wallet_name)
        }

        return res
    }

    walletExist = async (mnemonic) => {

        mnemonic = BlocksoftKeysUtils.recheckMnemonic(mnemonic)

        let walletHash = await BlocksoftKeysUtils.hashMnemonic(mnemonic)

        let result = await this.getWalletByHash(walletHash)

        return typeof result.array !== 'undefined' && result.array.length > 0
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
