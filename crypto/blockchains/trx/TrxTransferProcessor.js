/**
 * @version 0.5
 */
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

import TronUtils from './ext/TronUtils'

import TrxTronscanProvider from './basic/TrxTronscanProvider'
import TrxTrongridProvider from './basic/TrxTrongridProvider'

export default class TrxTransferProcessor {
    constructor(settings) {
        this._tronNodePath = 'https://api.trongrid.io'
        this._tronscanProvider = new TrxTronscanProvider()
        this._trongridProvider = new TrxTrongridProvider()
        this._tokenName = '_'
        if (typeof settings.tokenName !== 'undefined') {
            this._tokenName = settings.tokenName
        }
    }

    /**
     * @param {string} data.addressFrom
     * @returns {Promise<*>}
     */
    async getTransferPrecache(data) {
        return false
    }

    /**
     * @param {object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string|int} data.amount
     * @param {number|boolean} alreadyEstimatedGas
     * @returns {Promise<boolean>}
     */
    async getFeeRate(data, alreadyEstimatedGas = false) {
        return false
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        if (balanceRaw) return balanceRaw

        let address = data.addressFrom.trim()
        let addressHex = address
        if (address[0] === 'T') {
            addressHex = await TronUtils.addressToHex(address)
        } else {
            address = await TronUtils.addressHexToStr(addressHex)
        }
        let result = await this._tronscanProvider.get(address, this._tokenName)
        if (result === false) {
            result = await this._trongridProvider.get(addressHex, this._tokenName)
        }
        return result.balance
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.data
     * https://developers.tron.network/reference#walletcreatetransaction
     */
    async sendTx(data) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('TRX transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('TRX transaction required addressTo')
        }

        BlocksoftCryptoLog.log('TrxTxProcessor.sendTx started')

        let to_address, owner_address

        try {
            to_address = TronUtils.addressToHex(data.addressTo)
        } catch (e) {
            e.message += ' inside TronUtils.addressToHex to_address ' + data.addressTo
            throw e
        }

        try {
            owner_address = TronUtils.addressToHex(data.addressFrom)
        } catch (e) {
            e.message += ' inside TronUtils.addressToHex owner_address ' + data.addressFrom
            throw e
        }

        let params = {
            owner_address
        }
        let link
        if (this._tokenName[0] === 'T') {
            //https://developers.tron.network/docs/trc20-introduction#section-8usdt-transfer
            link = this._tronNodePath + '/wallet/triggersmartcontract'
            params.contract_address = TronUtils.addressToHex(this._tokenName)
            params.function_selector = 'transfer(address,uint256)'
            // noinspection PointlessArithmeticExpressionJS
            params.parameter = '0000000000000000000000' + to_address.toUpperCase() + '00000000000000000000000000000000000000000000' + BlocksoftUtils.decimalToHex(data.amount * 1, 20)
            params.fee_limit = 100000000
            params.call_value = 0
        } else {
            params.to_address = to_address
            // noinspection PointlessArithmeticExpressionJS
            params.amount = data.amount * 1

            if (this._tokenName === '_') {
                link = this._tronNodePath + '/wallet/createtransaction'
            } else {
                params.asset_name = '0x' + Buffer.from(this._tokenName).toString('hex')
                link = this._tronNodePath + '/wallet/transferasset'
            }
        }


        let res = await BlocksoftAxios.post(link, params)


        if (typeof res.data.Error != 'undefined') {
            throw new Error(res.data.Error)
        }

        let tx = res.data
        if (this._tokenName[0] === 'T') {
            if (typeof res.data.transaction == 'undefined' || typeof res.data.result == 'undefined') {
                if (typeof res.data.result.message != 'undefined') {
                    res.data.result.message = BlocksoftUtils.hexToUtf('0x' + res.data.result.message)
                }
                throw new Error('No tx in contract data ' + JSON.stringify(res.data))
            }
            tx = res.data.transaction
        } else {
            if (typeof res.data.txID == 'undefined') {
                if (typeof res.data.result.message != 'undefined') {
                    res.data.result.message = BlocksoftUtils.hexToUtf('0x' + res.data.result.message)
                }
                throw new Error('No txID in data ' + JSON.stringify(res.data))
            }
        }

        BlocksoftCryptoLog.log('TrxTxProcessor.sendTx tx', tx)

        tx.signature = [TronUtils.ECKeySign(Buffer.from(tx.txID, 'hex'), Buffer.from(data.privateKey, 'hex'))]
        BlocksoftCryptoLog.log('TrxTxProcessor.sendTx signed', tx)

        let send = await BlocksoftAxios.post(this._tronNodePath + '/wallet/broadcasttransaction', tx)
        BlocksoftCryptoLog.log('TrxTxProcessor.sendTx broadcast', send.data)

        if (typeof send.data.Error != 'undefined') {
            throw new Error(send.data.Error)
        }
        if (typeof send.data.result === 'undefined') {
            throw new Error('transaction result is undefined ' + JSON.stringify(send.data))
        }
        if (send.data.result !== true) {
            throw new Error('transaction result is false ' + JSON.stringify(send.data))
        }

        return { hash: tx.txID }
    }
}
