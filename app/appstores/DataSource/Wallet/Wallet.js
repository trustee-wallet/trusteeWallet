import DBInterface from '../DB/DBInterface'

import BlocksoftKeysUtils from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'

class Wallet {

    /**
     * @param {string} walletHash
     * @param {string} walletName
     */
    saveWallet = async (walletHash, walletName, walletJSON) => {
        const dbInterface = new DBInterface()

        await dbInterface.setQueryString(`INSERT INTO wallet (wallet_hash, wallet_name, wallet_json) VALUES ('${walletHash}', '${walletName}','${walletJSON}')`).query()

    }

    getWallets = async () => {
        const dbInterface = new DBInterface()

        return await dbInterface.setQueryString(`SELECT * FROM wallet`).query()
    }

    getWalletByHash = async (walletHash) => {
        const dbInterface = new DBInterface()

        return await dbInterface.setQueryString(`SELECT * FROM wallet WHERE wallet_hash='${walletHash}' LIMIT 1`).query()
    }

    walletExist = async (mnemonic) => {

        mnemonic = BlocksoftKeysUtils.recheckMnemonic(mnemonic)

        let walletHash = await BlocksoftKeysUtils.hashMnemonic(mnemonic)

        let result = await this.getWalletByHash(walletHash)

        return typeof result.array !== 'undefined' && result.array.length > 0
    }

}

export default new Wallet()
