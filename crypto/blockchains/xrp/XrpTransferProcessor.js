/**
 * @version 0.5
 * https://gist.github.com/WietseWind/19df307c3c68748543971242284ade4d
 *
 * https://xrpl.org/rippleapi-reference.html#preparepayment
 * https://xrpl.org/rippleapi-reference.html#sign
 * https://xrpl.org/rippleapi-reference.html#submit
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftDispatcher from '../BlocksoftDispatcher'
import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'

const Dispatcher = new BlocksoftDispatcher()

const API_PATH = 'wss://s1.ripple.com'
const RippleAPI = require('ripple-lib').RippleAPI


export default class XrpTransferProcessor {
    constructor(settings) {
        this._settings = settings

        this._api = new RippleAPI({ server: API_PATH }) // Public rippled server

        this._api.on('error', (errorCode, errorMessage) => {
            BlocksoftCryptoLog.log('XrpTransferProcessor constructor' + errorCode + ': ' + errorMessage)
        })
        this._api.on('connected', () => {

        })
        this._api.on('disconnected', (code) => {

        })
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
     * @param {string} data.addressForChange
     * @param {string|int} data.amount
     * @param {number|boolean} alreadyEstimatedGas
     * @returns {Promise<boolean>}
     */
    async getFeeRate(data, alreadyEstimatedGas = false) {
        if (data.amount <= 0) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' skipped as zero amount' )
            return false
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' started amount: ' + data.amount )

        let fee = 0
        try {
            let txJSON = JSON.parse(await this._getPrepared(data))
            fee = BlocksoftUtils.toUnified(txJSON.Fee, 6)
        } catch (e) {
            //if (data.addressForChange !== 'TRANSFER_ALL') {
                throw e
            //}
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XrpTransferProcessor.getFeeRate ' + data.addressFrom + ' => ' + data.addressTo + ' finished amount: ' + data.amount  + ' fee: ' + fee)
        return [
            {
                langMsg: 'xrp_speed_one',
                feeForTx: fee
            }
        ]
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.currencyCode
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.jsonData
     * @param {string} data.memo
     * @param {string} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} data.replacingTransaction
     * @param {number} data.nSequence
     * @param {string} balanceRaw
     * @returns {Promise<string>}
     */
    async getTransferAllBalance(data, balanceRaw) {
        if (!balanceRaw) {
            let balanceProvider = Dispatcher.getScannerProcessor(this._settings.currencyCode)
            balanceRaw = await balanceProvider.getBalance(data.addressFrom)
            if (balanceRaw && typeof balanceRaw.balance !== 'undefined' && balanceRaw.balance > 20) {
                balanceRaw = balanceRaw.balance
            } else {
                return 0
            }
        } else if (balanceRaw <= 20) {
            return 0
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')

        let txJSON = JSON.parse(await this._getPrepared(data))
        let fee = BlocksoftUtils.toUnified(txJSON.Fee, 6)
        let current = balanceRaw - fee - 20

        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + current)
        return current
    }


    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.data
     * @param {string} data.memo
     */
    async _getPrepared(data) {
        const payment = {
            'source': {
                'address': data.addressFrom,
                'maxAmount': {
                    'value': data.amount,
                    'currency': 'XRP'
                }
            },
            'destination': {
                'address': data.addressTo,
                'amount': {
                    'value': data.amount,
                    'currency': 'XRP'
                }
            }
        }

        if (data.addressFrom === data.addressTo) {
            let e = new Error('SERVER_RESPONSE_SELF_TX_FORBIDDEN')
            e.code = 'ERROR_USER'
            throw e
        }

        //https://xrpl.org/rippleapi-reference.html#payment
        if (typeof data.memo !== 'undefined' && data.memo.trim().length > 0) {
            let int = data.memo.trim() * 1
            if (int.toString() !== data.memo) {
                throw new Error('Destination tag type validation error')
            }
            if (int > 4294967295) {
                throw new Error('Destination tag couldnt be more then 4294967295')
            }
            payment.destination.tag = int
        }
        BlocksoftCryptoLog.log('XrpTransferProcessor._getPrepared payment', payment)

        let api = this._api

        return new Promise((resolve, reject) => {
            api.connect().then(() => {
                api.preparePayment(data.addressFrom, payment).then(prepared => {
                    //https://xrpl.org/rippleapi-reference.html#preparepayment
                    let txJSON = prepared.txJSON
                    BlocksoftCryptoLog.log('XrpTransferProcessor._getPrepared prepared', txJSON)
                    resolve(txJSON)
                }).catch(error => {
                    MarketingEvent.logOnlyRealTime('prepared_rippled_prepare_error ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, {payment, msg : error.toString()})
                    BlocksoftCryptoLog.log('XrpTransferProcessor._getPrepared error ' + error.toString())
                    reject(error)
                })
            }).catch(error => {
                MarketingEvent.logOnlyRealTime('prepared_rippled_prepare_no_connection ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, {payment, msg : error.toString()})
                BlocksoftCryptoLog.log('XrpTransferProcessor._getPrepared connect error ' + error.toString())

                reject(error)
            })
        })
    }

    /**
     * @param {string} data.privateKey
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string} data.amount
     * @param {string} data.data
     * @param {string} data.memo
     * @param {*} data.jsonData
     * @param {string} data.jsonData.publicKey
     */
    async sendTx(data) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('TRX transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('TRX transaction required addressTo')
        }


        let txJSON = await this._getPrepared(data)

        let api = this._api

        let result
        try {
            result = await new Promise((resolve, reject) => {
                //https://xrpl.org/rippleapi-reference.html#preparepayment
                BlocksoftCryptoLog.log('XrpTransferProcessor.sendTx prepared', txJSON)

                //https://xrpl.org/rippleapi-reference.html#sign
                if (typeof data.jsonData.publicKey === 'undefined') {
                    data.jsonData = JSON.parse(data.jsonData)
                }
                const keypair = {
                    privateKey: data.privateKey,
                    publicKey: data.jsonData.publicKey.toUpperCase()
                }

                let signed = api.sign(txJSON, keypair)
                BlocksoftCryptoLog.log('XrpTransferProcessor.sendTx signed', signed)

                api.connect().then(() => {
                    //https://xrpl.org/rippleapi-reference.html#submit
                    api.submit(signed.signedTransaction).then(result => {
                        MarketingEvent.logOnlyRealTime('prepared_rippled_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, {
                            txJSON,
                            result
                        })
                        resolve(result)
                    }).catch(error => {
                        MarketingEvent.logOnlyRealTime('prepared_rippled_send_error ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, {
                            txJSON,
                            msg: error.toString()
                        })
                        BlocksoftCryptoLog.log('XrpTransferProcessor.submit error ' + error.toString())
                        reject(error)
                    })
                }).catch(error => {
                    MarketingEvent.logOnlyRealTime('prepared_rippled_send_no_connection ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, {
                        txJSON,
                        msg: error.toString()
                    })
                    BlocksoftCryptoLog.log('XrpTransferProcessor.sendTx connect error ' + error.toString())
                    reject(error)
                })
            })
        } catch (e) {
            MarketingEvent.logOnlyRealTime('prepared_rippled_send2_error ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, {txJSON, msg : e.toString()})
            BlocksoftCryptoLog.log('XrpTransferProcessor.send2 error ' + e.toString())
            if (typeof e.resultMessage !== 'undefined') {
                throw new Error(e.resultMessage.toString())
            } else if (typeof e.message !== 'undefined') {
                throw new Error(e.message.toString())
            } else {
                throw new Error(e.toString())
            }

        }

        MarketingEvent.logOnlyRealTime('prepared_rippled_any_result ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, {txJSON, result})
        BlocksoftCryptoLog.log('XrpTransferProcessor.sendTx result', result)

        if (result.resultCode === 'tecNO_DST_INSUF_XRP') {
            let e = new Error(result.resultMessage) // not enough - could be replaced by translated
            e.code = 'ERROR_USER'
            throw e
        } else if (result.resultCode === 'tecUNFUNDED_PAYMENT') {
            let e = new Error('SERVER_RESPONSE_NOT_ENOUGH_BALANCE_XRP') // not enough to pay
            e.code = 'ERROR_USER'
            throw e
        } else if (result.resultCode === 'tecNO_DST_INSUF_XRP') {
            let e = new Error('SERVER_RESPONSE_NOT_ENOUGH_BALANCE_DEST_XRP') // not enough to create account
            e.code = 'ERROR_USER'
            throw e

        }

        if (typeof result.tx_json === 'undefined' || typeof result.tx_json.hash === 'undefined') {
            throw new Error(result.resultMessage) // not enough
        }

        if (result.resultCode !== 'tesSUCCESS') {
            return { hash: result.tx_json.hash, successMessage: result.resultMessage } // Held until escalated fee drops
        }

        return { hash: result.tx_json.hash }
    }


}
