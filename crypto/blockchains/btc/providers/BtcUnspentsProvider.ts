/**
 * @version 0.20
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 * https://doge1.trezor.io/api/v2/utxo/D5oKvWEibVe74CXLASmhpkRpLoyjgZhm71
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import DogeUnspentsProvider from '../../doge/providers/DogeUnspentsProvider'

import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const CACHE_FOR_CHANGE = {
    'b' : '',
    '1' : '',
    '3' : ''
}

export default class BtcUnspentsProvider extends DogeUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        super(settings, serverCode)
        CACHE_FOR_CHANGE['b'] = ''
        CACHE_FOR_CHANGE['1'] = ''
        CACHE_FOR_CHANGE['3'] = ''
    }

    static getCache() {
        return CACHE_FOR_CHANGE
    }

    _isMyAddress(voutAddress: string, address: string): string {
        if (voutAddress === CACHE_FOR_CHANGE['b'] || voutAddress === CACHE_FOR_CHANGE['1'] || voutAddress === CACHE_FOR_CHANGE['3']) {
            return voutAddress
        }
        return  ''
    }

    async getUnspents(address : string) : Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        const dbInterface = new DBInterface()
        const sqlPub = `SELECT wallet_pub_value as walletPub
            FROM wallet_pub
            WHERE wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='BTC'
        `
        const totalUnspents = []
        const resPub = await dbInterface.setQueryString(sqlPub).query()
        if (resPub && resPub.array && resPub.array.length > 0) {
            for (const row of resPub.array) {
                const unspents = await super.getUnspents(row.walletPub)
                if (unspents) {
                    for (const unspent of unspents) {
                        unspent.derivationPath = row.path
                        totalUnspents.push(unspent)
                    }
                }
            }

            const sql = `SELECT account.address, account.derivation_path as derivationPath
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='BTC' AND (already_shown IS NULL OR already_shown=0)
            AND derivation_type!='main'
            ORDER BY derivation_index ASC
        `
            const res = await dbInterface.setQueryString(sql).query()
            for (const row of res.array) {
                const prefix = row.address.substr(0,1)
                if (CACHE_FOR_CHANGE[prefix] === "") {
                    CACHE_FOR_CHANGE[prefix] = row.address
                }
            }

        } else {

            const sql = `SELECT account.address, account.derivation_path as derivationPath
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='BTC'
        `
            const res = await dbInterface.setQueryString(sql).query()
            for (const row of res.array) {
                const unspents = await super.getUnspents(row.address)
                // @ts-ignore
                CACHE_FOR_CHANGE[row.address.substr(0,1)] = row.address
                if (unspents) {
                    for (const unspent of unspents) {
                        unspent.address = row.address
                        unspent.derivationPath = dbInterface.unEscapeString(row.derivationPath)
                        totalUnspents.push(unspent)
                    }
                }
            }
        }
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents finished ' + address, totalUnspents)
        return totalUnspents
    }
}
