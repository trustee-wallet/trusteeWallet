/**
 * @version 0.20
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 * https://doge1.trezor.io/api/v2/utxo/D5oKvWEibVe74CXLASmhpkRpLoyjgZhm71
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import DogeUnspentsProvider from '../../doge/providers/DogeUnspentsProvider'

import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const CACHE_FOR_CHANGE = {}

export default class BtcUnspentsProvider extends DogeUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    static async getCache(walletHash : string) {
        if (typeof CACHE_FOR_CHANGE[walletHash] !== 'undefined') {
            return CACHE_FOR_CHANGE[walletHash]
        }
        await BlocksoftCryptoLog.log('BtcUnspentsProvider.getCache ' + walletHash + ' started as ' + JSON.stringify(CACHE_FOR_CHANGE[walletHash]))

        const dbInterface = new DBInterface()

        const sqlPub = `SELECT wallet_pub_value as walletPub
            FROM wallet_pub
            WHERE wallet_hash = '${walletHash}
            AND currency_code='BTC'
        `
        const resPub = await dbInterface.setQueryString(sqlPub).query()
        if (resPub && resPub.array && resPub.array.length > 0) {

            const sql = `SELECT account.address
            FROM account
            WHERE account.wallet_hash = '${walletHash}
            AND currency_code='BTC' AND (already_shown IS NULL OR already_shown=0)
            AND derivation_type!='main'
            ORDER BY derivation_index ASC
        `
            const res = await dbInterface.setQueryString(sql).query()
            for (const row of res.array) {
                const prefix = row.address.substr(0, 1)
                await BlocksoftCryptoLog.log('BtcUnspentsProvider.getCache started HD CACHE_FOR_CHANGE ' + walletHash)
                // @ts-ignore
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {
                        '1' : '',
                        '3' : '',
                        'b' : ''
                    }
                }
                // @ts-ignore
                if (CACHE_FOR_CHANGE[walletHash][prefix] === '') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash][prefix] = row.address
                    // @ts-ignore
                    await BlocksoftCryptoLog.log('BtcUnspentsProvider.getCache started HD CACHE_FOR_CHANGE '
                        + walletHash + ' ' + prefix + ' changed ' + JSON.stringify(CACHE_FOR_CHANGE[walletHash]))
                }
            }

        } else {

            const sql = `SELECT account.address
            FROM account
            WHERE account.wallet_hash = '${walletHash}'
            AND currency_code='BTC'
        `
            const res = await dbInterface.setQueryString(sql).query()
            for (const row of res.array) {
                // @ts-ignore
                await BlocksoftCryptoLog.log('BtcUnspentsProvider.getUnspents started CACHE_FOR_CHANGE ' + walletHash)
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {
                        '1' : '',
                        '3' : '',
                        'b' : ''
                    }
                }
                // @ts-ignore
                CACHE_FOR_CHANGE[walletHash][row.address.substr(0, 1)] = row.address
            }
        }
        if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
            throw new Error('BtcUnspentsProvider no CACHE_FOR_CHANGE retry for ' + walletHash)
        }
        return CACHE_FOR_CHANGE[walletHash]
    }

    _isMyAddress(voutAddress: string, address: string, walletHash: string): string {
        // @ts-ignore
        if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
            return ''
        }
        // @ts-ignore
        if (voutAddress === CACHE_FOR_CHANGE[walletHash]['b'] || voutAddress === CACHE_FOR_CHANGE[walletHash]['1'] || voutAddress === CACHE_FOR_CHANGE[walletHash]['3']) {
            return voutAddress
        }
        return ''
    }

    async getUnspents(address: string): Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
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

            const sql = `SELECT account.address, account.derivation_path as derivationPath, wallet_hash AS walletHash
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='BTC' AND (already_shown IS NULL OR already_shown=0)
            AND derivation_type!='main'
            ORDER BY derivation_index ASC
        `
            const res = await dbInterface.setQueryString(sql).query()
            for (const row of res.array) {
                const walletHash = row.walletHash
                const prefix = row.address.substr(0, 1)
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents started HD CACHE_FOR_CHANGE ' + address + ' walletHash ' + walletHash)
                // @ts-ignore
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {
                        '1' : '',
                        '3' : '',
                        'b' : ''
                    }
                }
                // @ts-ignore
                if (CACHE_FOR_CHANGE[walletHash][prefix] === '') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash][prefix] = row.address
                    // @ts-ignore
                    await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents started HD CACHE_FOR_CHANGE '
                        + address + ' walletHash ' + walletHash + ' ' + prefix + ' changed ' + JSON.stringify(CACHE_FOR_CHANGE[walletHash]))
                }
            }

        } else {

            const sql = `SELECT account.address, account.derivation_path as derivationPath, wallet_hash AS walletHash
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='BTC'
        `
            const res = await dbInterface.setQueryString(sql).query()
            for (const row of res.array) {
                const walletHash = row.walletHash
                const unspents = await super.getUnspents(row.address)
                // @ts-ignore
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents started CACHE_FOR_CHANGE ' + address + ' walletHash ' + walletHash)
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {
                        '1' : '',
                        '3' : '',
                        'b' : ''
                    }
                }
                // @ts-ignore
                CACHE_FOR_CHANGE[walletHash][row.address.substr(0, 1)] = row.address
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
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents finished ' + address, totalUnspents)
        return totalUnspents
    }
}
