/**
 * @version 0.5
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 * https://doge1.trezor.io/api/v2/utxo/D5oKvWEibVe74CXLASmhpkRpLoyjgZhm71
 *
 * @typedef {Object} UnifiedUnspent
 * @property {*} txid '1885a8fc772be4704cbdbaf84b39956cbb4eb69e5eef0a3d35ba5cb29b0af333',
 * @property {*} vout 1
 * @property {*} value 9998331800
 * @property {*} valueBN 9998331800
 * @property {*} height 3038080
 * @property {*} confirmations 11808
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import { unpad } from 'ethereumjs-util'
import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import accountDS from '../../../../app/appstores/DataSource/Account/Account'

export default class BtcUnspentsProvider {
    /**
     * @type {string}
     * @private
     */
    _trezorServerCode = 'BTC_TREZOR_SERVER'

    /**
     * @private
     */
    _trezorServer = false

    constructor(settings, serverCode) {
        this._settings = settings
        this._trezorServerCode = serverCode
    }

    async getTx(tx, allUnspents) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getTx started ' + tx)

        const dbInterface = new DBInterface()

        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'BTC.Unspents.getTx')

        const link = this._trezorServer + '/api/v2/tx/' + tx
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined' || !res.data) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getTx no tx ' + tx)
            throw new Error('SERVER_RESPONSE_BAD_TX_TO_REPLACE')
        }

        const sortedUnspents = []
        let unspent

        const unique = {}
        if (allUnspents) {
            for (unspent of allUnspents) {
                if (unspent.txid === tx) continue
                if (typeof unspent.address === 'undefined') {
                    unspent.address = unspent.addresses[0]
                }
                const key = unspent.txid + '_' + unspent.address + '_' + unspent.n
                if (typeof unique[key] !== 'undefined') continue
                unique[key] = sortedUnspents.length
                sortedUnspents.push(unspent)
            }
        }
        let txIn = 0
        for (unspent of res.data.vin) {
            if (unspent.txid === tx) continue
            if (typeof unspent.address === 'undefined') {
                unspent.address = unspent.addresses[0]
            }
            const key = unspent.txid + '_' + unspent.address + '_' + unspent.n
            if (typeof unique[key] !== 'undefined') {
                const index = unique[key]
                sortedUnspents[index].confirmations = 11
                sortedUnspents[index].isRequired = true
            } else {
                unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
                if (unspent.address) {
                    const res = await dbInterface.setQueryString(`SELECT id, address, derivation_path AS path FROM account WHERE address='${unspent.address}' AND currency_code='BTC' AND derivation_path IS NOT NULL LIMIT 1`).query()
                    if (res && res.array && res.array[0]) {
                        unspent.path = dbInterface.unEscapeString(res.array[0].path)
                    }
                }

                if (typeof unspent.vout === 'undefined') {
                    try {
                        const link2 = this._trezorServer + '/api/v2/tx/' + unspent.txid
                        const res2 = await BlocksoftAxios.getWithoutBraking(link2)
                        if (res2 && typeof res2.data !== 'undefined' && res2.data && typeof res2.data.vout !== 'undefined' && res2.data.vout) {
                            let tmp
                            if (res2.data.vout.length > 0) {
                                for (tmp of res2.data.vout) {
                                    if (typeof tmp.addresses !== 'undefined' && tmp.addresses) {
                                        if (typeof tmp.addresses[0] !== 'undefined') {
                                            if (tmp.addresses[0] === unspent.address) {
                                                unspent.vout = tmp.n
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getTx while loading output data ' + JSON.stringify(unspent))
                    }
                    if (typeof unspent.vout === 'undefined') {
                        continue
                    }
                }
                unspent.confirmations = 10 // to use
                unspent.isSegwit = false
                if (unspent.address.indexOf('bc1') === 0) {
                    unspent.isSegwit = '_SEGWIT'
                } else if (unspent.address.indexOf('3') === 0) {
                    unspent.isSegwit = '_SEGWIT_COMPATIBLE'
                }
                unspent.isRequired = true
                unique[key] = sortedUnspents.length
                sortedUnspents.push(unspent)
                txIn++
            }
        }
        if (txIn === 0) {
            throw new Error('SERVER_RESPONSE_BAD_TX_TO_REPLACE')
        }
        let addressTo = false

        if (typeof res.data.vout !== 'undefined' && typeof res.data.vout[0].addresses !== 'undefined' && typeof res.data.vout[0].addresses[0] !== 'undefined') {
            addressTo = res.data.vout[0].addresses[0]
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getTx found ' + tx + ' to ' + addressTo, sortedUnspents)
        return { sortedUnspents, addressTo }

    }


    /**
     * @param address
     * @param addressLegacy
     * @param addressCompatible
     * @returns {Promise<UnifiedUnspent[]>}
     */
    async getUnspents(address, addressLegacy, addressCompatible = '', source) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents started ' + address + ' ' + addressLegacy + ' ' + addressCompatible)

        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'BTC.Unspents.getUnspents')

        const tmp = []
        try {
            tmp[0] = await this._getUnspents(address, source)
            tmp[1] = await this._getUnspents(addressLegacy, source)
            if (addressCompatible) {
                tmp[2] = await this._getUnspents(addressCompatible, source)
            }

            const badAddresses = await accountDS.getAccountData({ derivationPath: 'm/49quote/0quote/0/1/0' })
            if (badAddresses) {
                if (typeof tmp[2] === 'undefined' || !tmp[2]) {
                    tmp[2] = []
                }
                let bad, badInput
                for (bad of badAddresses) {
                    const res = await this._getUnspents(bad.address)
                    if (res && typeof res !== 'undefined' && res.length > 0) {
                        for (badInput of res) {
                            badInput.address = bad.address
                            badInput.path = 'm/49quote/0quote/0/1/0'
                            tmp[2].push(badInput)
                        }
                    }
                }
            }
        } catch (e) {
            e.message += ' in getUnspents '
            throw e
        }

        const sortedUnspents = []
        let unspent
        if (tmp[0]) {
            for (unspent of tmp[0]) {
                unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
                if (typeof unspent.address === 'undefined') {
                    unspent.address = address
                }
                unspent.isSegwit = '_SEGWIT'
                unspent.isRequired = false
                sortedUnspents.push(unspent)
            }
        }
        if (tmp[1]) {
            for (unspent of tmp[1]) {
                unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
                if (typeof unspent.address === 'undefined') {
                    unspent.address = addressLegacy
                }
                unspent.isSegwit = false
                unspent.isRequired = false
                sortedUnspents.push(unspent)
            }
        }
        if (typeof tmp[2] !== 'undefined' && tmp[2]) {
            for (unspent of tmp[2]) {
                unspent.valueBN = BlocksoftUtils.toBigNumber(unspent.value)
                if (typeof unspent.address === 'undefined') {
                    unspent.address = addressCompatible
                }
                unspent.isSegwit = '_SEGWIT_COMPATIBLE'
                unspent.isRequired = false
                sortedUnspents.push(unspent)
            }
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider.getUnspents result ' + address + ' ' + addressLegacy, sortedUnspents)
        return sortedUnspents
    }

    /**
     * @param address
     * @returns {Promise<*[]|*>}
     * @private
     */
    async _getUnspents(address, source) {
        if (!address || typeof address === 'undefined') return false
        let link = this._trezorServer + '/api/v2/utxo/' + address + '?gap=9999'// ?confirmed=true
        let res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider._getUnspents ' + source + ' nothing loaded for address ' + address + ' link ' + link)
            await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)

            this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'BTC.Unspents.getUnspents error')
            link = this._trezorServer + '/api/v2/utxo/' + address + '?gap=9999'// ?confirmed=true
            res = await BlocksoftAxios.getWithoutBraking(link)
            if (!res || typeof res.data === 'undefined') {
                if (source && source.indexOf('sendTx') === -1) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcUnspentsProvider._getUnspents ' + source + ' nothing loaded for address ' + address + ' link ' + link)
                } else {
                    BlocksoftCryptoLog.err(this._settings.currencyCode + ' BtcUnspentsProvider._getUnspents ' + source + ' nothing loaded for address ' + address + ' link ' + link)
                }
            }
        }
        if (!res || typeof res.data === 'undefined' || !res.data || typeof res.data[0] === 'undefined') {
            return false
        }
        return res.data
    }
}
