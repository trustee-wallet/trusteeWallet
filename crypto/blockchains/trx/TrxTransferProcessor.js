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
        this._settings = settings
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
        if (data.addressTo && data.addressTo !== data.addressFrom) {
            try {
                const res = await BlocksoftAxios.get('https://apilist.tronscan.org/api/account?address=' + data.addressTo)
                if (res.data.bandwidth.freeNetRemaining.toString() === '0') {
                    return [
                        {
                            langMsg: 'xrp_speed_one',
                            feeForTx: 100000
                        }
                    ]
                }
            } catch (e) {
                // do nothing
            }
        }
        return false
    }

    /**
     * @param {Object} data
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        let feeForTx = 0
        if (data.addressTo && data.addressTo !== data.addressFrom) {
            try {
                const res = await BlocksoftAxios.get('https://apilist.tronscan.org/api/account?address=' + data.addressTo)
                if (res.data.bandwidth.freeNetRemaining.toString() === '0') {
                    feeForTx = 100000
                }
            } catch (e) {
                // do nothing
            }
        }
        if (balanceRaw) {
            if (feeForTx > 0) {
                return BlocksoftUtils.toBigNumber(balanceRaw).sub(BlocksoftUtils.toBigNumber(feeForTx)).toString()
            } else {
                return balanceRaw
            }
        }

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
        if (this._tokenName === '_' && feeForTx > 0) {
            return BlocksoftUtils.toBigNumber(result.balance).sub(BlocksoftUtils.toBigNumber(feeForTx)).toString()
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
        if (data.addressFrom === data.addressTo) {
            const e = new Error('SERVER_RESPONSE_SELF_TX_FORBIDDEN')
            e.code = 'ERROR_USER'
            throw e
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx started')

        let toAddress, ownerAddress

        try {
            toAddress = TronUtils.addressToHex(data.addressTo)
        } catch (e) {
            e.message += ' inside TronUtils.addressToHex to_address ' + data.addressTo
            throw e
        }

        try {
            ownerAddress = TronUtils.addressToHex(data.addressFrom)
        } catch (e) {
            e.message += ' inside TronUtils.addressToHex owner_address ' + data.addressFrom
            throw e
        }

        const params = {
            owner_address: ownerAddress
        }
        let link
        if (this._tokenName[0] === 'T') {
            // https://developers.tron.network/docs/trc20-introduction#section-8usdt-transfer
            link = this._tronNodePath + '/wallet/triggersmartcontract'
            params.contract_address = TronUtils.addressToHex(this._tokenName)
            params.function_selector = 'transfer(address,uint256)'
            // noinspection PointlessArithmeticExpressionJS
            params.parameter = '0000000000000000000000' + toAddress.toUpperCase() + '00000000000000000000000000000000000000000000' + BlocksoftUtils.decimalToHex(data.amount * 1, 20)
            params.fee_limit = 100000000
            params.call_value = 0
        } else {
            params.to_address = toAddress
            // noinspection PointlessArithmeticExpressionJS
            params.amount = data.amount * 1

            if (this._tokenName === '_') {
                link = this._tronNodePath + '/wallet/createtransaction'
            } else {
                params.asset_name = '0x' + Buffer.from(this._tokenName).toString('hex')
                link = this._tronNodePath + '/wallet/transferasset'
            }
        }


        const res = await BlocksoftAxios.post(link, params)


        if (typeof res.data.Error !== 'undefined') {
            this.checkError(res.data.Error.message || res.data.Error)
        }

        let tx = res.data
        if (this._tokenName[0] === 'T') {
            if (typeof res.data.transaction === 'undefined' || typeof res.data.result === 'undefined') {
                if (typeof res.data.result.message !== 'undefined') {
                    res.data.result.message = BlocksoftUtils.hexToUtf('0x' + res.data.result.message)
                }
                this.checkError('No tx in contract data ' + JSON.stringify(res.data))
            }
            tx = res.data.transaction
        } else {
            if (typeof res.data.txID === 'undefined') {
                if (typeof res.data.result.message !== 'undefined') {
                    res.data.result.message = BlocksoftUtils.hexToUtf('0x' + res.data.result.message)
                }
                this.checkError('No txID in data ' + JSON.stringify(res.data))
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx tx', tx)

        tx.signature = [TronUtils.ECKeySign(Buffer.from(tx.txID, 'hex'), Buffer.from(data.privateKey, 'hex'))]
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx signed', tx)

        const send = await BlocksoftAxios.post(this._tronNodePath + '/wallet/broadcasttransaction', tx)
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' TrxTxProcessor.sendTx broadcast', send.data)

        if (!send.data) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (typeof send.data.Error !== 'undefined') {
            throw new Error(send.data.Error)
        }
        if (typeof send.data.result === 'undefined') {
            if (typeof (send.data.message) !== 'undefined') {
                let msg = false
                try {
                    const buf = Buffer.from(send.data.message, 'hex')
                    msg = buf.toString('')
                } catch (e) {
                    // do nothing
                }
                if (msg) {
                    send.data.decoded = msg
                    this.checkError(msg)
                }
            }
            this.checkError('no transaction result ' + JSON.stringify(send.data))
        }
        if (send.data.result !== true) {
            this.checkError('transaction result is false ' + JSON.stringify(send.data))
        }

        return { hash: tx.txID }
    }

    checkError(msg) {
        if (this._settings.currencyCode !== 'TRX' && msg.indexOf('AccountResourceInsufficient') !== -1) {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
        } else if (msg.indexOf('balance is not sufficient') !== -1) {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
        } else if (msg.indexOf('Amount must greater than 0') !== -1) {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
        } else if (msg.indexOf('assetBalance must be greater than 0') !== -1 || msg.indexOf('assetBalance is not sufficient') !== -1) {
            throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
        } else {
            throw new Error(msg)
        }
    }
}
