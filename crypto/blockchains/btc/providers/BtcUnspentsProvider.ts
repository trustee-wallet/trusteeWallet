/**
 * @version 0.20
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 * https://doge1.trezor.io/api/v2/utxo/D5oKvWEibVe74CXLASmhpkRpLoyjgZhm71
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import DogeUnspentsProvider from '../../doge/providers/DogeUnspentsProvider'

import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

export default class BtcUnspentsProvider extends DogeUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    async getUnspents(address : string) : Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        const dbInterface = new DBInterface()
        const sql = `SELECT account.address, account.derivation_path as derivationPath
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='BTC'
        `
        const res = await dbInterface.setQueryString(sql).query()
        const totalUnspents = []
        for (const row of res.array) {
            const unspents = await super.getUnspents(row.address)
            if (unspents) {
                for (const unspent of unspents) {
                    unspent.address = row.address
                    unspent.derivationPath = dbInterface.unEscapeString(row.derivationPath)
                    totalUnspents.push(unspent)
                }
            }
        }
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents finished ' + address, totalUnspents)
        return totalUnspents
    }
}
