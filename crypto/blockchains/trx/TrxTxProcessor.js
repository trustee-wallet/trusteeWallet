import BlocksoftAxios from '../../common/BlocksoftAxios'
import TronUtils from './ext/TronUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

class TrxTxProcessor {
    constructor(settings) {
        this._tronNodePath = 'https://api.trongrid.io'
        this._tokenName = '_'
        if (typeof settings.tokenName !== 'undefined') {
            this._tokenName = settings.tokenName
        }
    }


    async getNetworkPrices() {
        return {}
    }

    async getFeeRate(data, alreadyEstimatedGas = false) {
        return false
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
            params.function_selector = "transfer(address,uint256)"
            params.parameter = "0000000000000000000000" + to_address.toUpperCase() + "00000000000000000000000000000000000000000000" + BlocksoftUtils.decimalToHex(data.amount * 1, 20)
            params.fee_limit = 100000000
            params.call_value = 0
        } else {
            params.to_address = to_address
            params.amount = data.amount*1

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

module.exports.init = function(settings) {
    return new TrxTxProcessor(settings)
}
