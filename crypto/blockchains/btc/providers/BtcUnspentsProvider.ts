/**
 * @version 0.20
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 * https://doge1.trezor.io/api/v2/utxo/D5oKvWEibVe74CXLASmhpkRpLoyjgZhm71
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import DogeUnspentsProvider from '../../doge/providers/DogeUnspentsProvider'

import Database from '@app/appstores/DataSource/Database';
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftDict from '@crypto/common/BlocksoftDict'
import main from '@app/appstores/DataSource/Database'

const CACHE_FOR_CHANGE = {}

export default class BtcUnspentsProvider extends DogeUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    static async getCache(walletHash : string, currencyCode = 'BTC') {
        if (typeof CACHE_FOR_CHANGE[walletHash] !== 'undefined') {
            return CACHE_FOR_CHANGE[walletHash]
        }
        const mainCurrencyCode = currencyCode === 'LTC' ?  'LTC' : 'BTC'
        const segwitPrefix = BlocksoftDict.CurrenciesForTests[mainCurrencyCode + '_SEGWIT'].addressPrefix

        BlocksoftCryptoLog.log(currencyCode + ' ' + mainCurrencyCode + '  BtcUnspentsProvider.getCache ' + walletHash + ' started as ' + JSON.stringify(CACHE_FOR_CHANGE[walletHash]))

        const sqlPub = `SELECT wallet_pub_value as walletPub
            FROM wallet_pub
            WHERE wallet_hash = '${walletHash}
            AND currency_code='${mainCurrencyCode}'
        `
        const resPub = await Database.query(sqlPub)
        if (resPub && resPub.array && resPub.array.length > 0) {

            const sql = `SELECT account.address
            FROM account
            WHERE account.wallet_hash = '${walletHash}
            AND currency_code='${mainCurrencyCode}' AND (already_shown IS NULL OR already_shown=0)
            AND derivation_type!='main'
            ORDER BY derivation_index ASC
        `
            const res = await Database.query(sql)
            for (const row of res.array) {
                const prefix = row.address.indexOf(segwitPrefix) === 0 ? segwitPrefix : row.address.substr(0, 1)
                await BlocksoftCryptoLog.log(currencyCode + ' ' + mainCurrencyCode + ' BtcUnspentsProvider.getCache started HD CACHE_FOR_CHANGE ' + walletHash)
                // @ts-ignore
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {}
                }
                // @ts-ignore
                if (typeof CACHE_FOR_CHANGE[walletHash][prefix] === 'undefined' || CACHE_FOR_CHANGE[walletHash][prefix] === '') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash][prefix] = row.address
                    // @ts-ignore
                    await BlocksoftCryptoLog.log(currencyCode + ' ' + mainCurrencyCode + ' BtcUnspentsProvider.getCache started HD CACHE_FOR_CHANGE '
                        + walletHash + ' ' + prefix + ' changed ' + JSON.stringify(CACHE_FOR_CHANGE[walletHash]))
                }
            }

        } else {

            const sql = `SELECT account.address
            FROM account
            WHERE account.wallet_hash = '${walletHash}'
            AND currency_code='${mainCurrencyCode}'
        `
            const res = await Database.query(sql)
            for (const row of res.array) {
                // @ts-ignore
                await BlocksoftCryptoLog.log(currencyCode + '/' + mainCurrencyCode + ' BtcUnspentsProvider.getUnspents started CACHE_FOR_CHANGE ' + walletHash)
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {}
                }
                const prefix = row.address.indexOf(segwitPrefix) === 0 ? segwitPrefix : row.address.substr(0, 1)
                // @ts-ignore
                CACHE_FOR_CHANGE[walletHash][prefix] = row.address
            }
        }
        if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
            throw new Error(currencyCode + '/' + mainCurrencyCode + ' BtcUnspentsProvider no CACHE_FOR_CHANGE retry for ' + walletHash)
        }
        return CACHE_FOR_CHANGE[walletHash]
    }

    _isMyAddress(voutAddress: string, address: string, walletHash: string): string {
        // @ts-ignore
        if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined' || !CACHE_FOR_CHANGE[walletHash]) {
            return ''
        }
        // @ts-ignore
        let found = ''
        for (const key in CACHE_FOR_CHANGE[walletHash]) {
            BlocksoftCryptoLog.log('CACHE_FOR_CHANGE[walletHash][key]', key + '_' + CACHE_FOR_CHANGE[walletHash][key])
            if (voutAddress === CACHE_FOR_CHANGE[walletHash][key]) {
                found = voutAddress
            }
        }
        return found
    }

    async getUnspents(address: string): Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        const mainCurrencyCode = this._settings.currencyCode === 'LTC' ?  'LTC' : 'BTC'
        const segwitPrefix = BlocksoftDict.CurrenciesForTests[mainCurrencyCode + '_SEGWIT'].addressPrefix

        const sqlPub = `SELECT wallet_pub_value as walletPub
            FROM wallet_pub
            WHERE wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='${mainCurrencyCode}'
        `
        const totalUnspents = []
        const resPub = await Database.query(sqlPub)
        if (resPub && resPub.array && resPub.array.length > 0) {
            for (const row of resPub.array) {
                const unspents = await super.getUnspents(row.walletPub)
                if (unspents) {
                    for (const unspent of unspents) {
                        totalUnspents.push(unspent)
                    }
                }
            }
            const sqlAdditional = `SELECT account.address, account.derivation_path as derivationPath, wallet_hash AS walletHash
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND account.derivation_path = 'm/49quote/0quote/0/1/0'
            AND currency_code='${mainCurrencyCode}'
            `
            const resAdditional = await Database.query(sqlAdditional)
            if (resAdditional && resAdditional.array && resAdditional.array.length > 0) {
                for (const row of resAdditional.array) {
                    const unspents = await super.getUnspents(row.address)
                    if (unspents) {
                        for (const unspent of unspents) {
                            unspent.address = row.address
                            unspent.derivationPath = Database.unEscapeString(row.derivationPath)
                            totalUnspents.push(unspent)
                        }
                    }
                }
            }

            const sql = `SELECT account.address, account.derivation_path as derivationPath, wallet_hash AS walletHash
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='${mainCurrencyCode}' AND (already_shown IS NULL OR already_shown=0)
            AND derivation_type!='main'
            ORDER BY derivation_index ASC
        `
            const res = await Database.query(sql)
            for (const row of res.array) {
                const walletHash = row.walletHash
                const prefix = row.address.indexOf(segwitPrefix) === 0 ? segwitPrefix : row.address.substr(0, 1)
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' ' + mainCurrencyCode + ' BtcUnspentsProvider.getUnspents started HD CACHE_FOR_CHANGE ' + address + ' walletHash ' + walletHash)
                // @ts-ignore
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {}
                }
                // @ts-ignore
                if (typeof CACHE_FOR_CHANGE[walletHash][prefix] === 'undefined' || CACHE_FOR_CHANGE[walletHash][prefix] === '') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash][prefix] = row.address
                    // @ts-ignore
                    await BlocksoftCryptoLog.log(this._settings.currencyCode + ' ' + mainCurrencyCode + ' BtcUnspentsProvider.getUnspents started HD CACHE_FOR_CHANGE '
                        + address + ' walletHash ' + walletHash + ' ' + prefix + ' changed ' + JSON.stringify(CACHE_FOR_CHANGE[walletHash]))
                }
            }

        } else {

            const sql = `SELECT account.address, account.derivation_path as derivationPath, wallet_hash AS walletHash
            FROM account
            WHERE account.wallet_hash = (SELECT wallet_hash FROM account WHERE address='${address}')
            AND currency_code='${mainCurrencyCode}'
        `
            const res = await Database.query(sql)
            for (const row of res.array) {
                const walletHash = row.walletHash
                const unspents = await super.getUnspents(row.address)
                // @ts-ignore
                await BlocksoftCryptoLog.log(this._settings.currencyCode + '/' + mainCurrencyCode + ' BtcUnspentsProvider.getUnspents started CACHE_FOR_CHANGE ' + address + ' ' + row.address + ' walletHash ' + walletHash)
                if (typeof CACHE_FOR_CHANGE[walletHash] === 'undefined') {
                    // @ts-ignore
                    CACHE_FOR_CHANGE[walletHash] = {}
                }
                const prefix = row.address.indexOf(segwitPrefix) === 0 ? segwitPrefix : row.address.substr(0, 1)
                // @ts-ignore
                CACHE_FOR_CHANGE[walletHash][prefix] = row.address
                if (unspents) {
                    for (const unspent of unspents) {
                        unspent.address = row.address
                        unspent.derivationPath = Database.unEscapeString(row.derivationPath)
                        totalUnspents.push(unspent)
                    }
                }
            }
        }
        // @ts-ignore
        if (totalUnspents.length > 10) {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' ' + mainCurrencyCode + ' BtcUnspentsProvider.getUnspents finished ' + address + ' total ' + totalUnspents.length, totalUnspents.slice(0, 10))
        } else {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' ' + mainCurrencyCode + ' BtcUnspentsProvider.getUnspents finished ' + address + ' total ' + totalUnspents.length, totalUnspents)
        }
        return totalUnspents
    }
}
