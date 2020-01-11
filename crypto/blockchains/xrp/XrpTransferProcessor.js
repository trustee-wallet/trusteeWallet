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
     * @param {string|int} data.amount
     * @param {number|boolean} alreadyEstimatedGas
     * @returns {Promise<boolean>}
     */
    async getFeeRate(data, alreadyEstimatedGas = false) {
        let txJSON = JSON.parse(await this._getPrepared(data))
        let fee = BlocksoftUtils.toUnified(txJSON.Fee, 6)
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
        let txJSON = JSON.parse(await this._getPrepared(data))
        let fee = BlocksoftUtils.toUnified(txJSON.Fee, 6)

        if (balanceRaw) return balanceRaw - fee - 20

        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')

        let balanceProvider = Dispatcher.getScannerProcessor(this._settings)
        let current = await balanceProvider.getBalance(data.addressFrom) - fee - 20

        BlocksoftCryptoLog.log(this._settings.currencyCode + 'TransferProcessor.getTransferAllBalance ', data.addressFrom + ' => ' + current.balance)
        return current.balance
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

        //https://xrpl.org/rippleapi-reference.html#payment
        if (typeof data.memo !== 'undefined' && data.memo.length > 0) {
            let int = data.memo * 1
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
                    BlocksoftCryptoLog.log('XrpTransferProcessor._getPrepared error ' + error.toString())
                    reject(error)
                })
            }).catch(error => {
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
        let result = await new Promise((resolve, reject) => {
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

            //https://xrpl.org/rippleapi-reference.html#submit
            api.submit(signed.signedTransaction).then(result => {
                resolve(result)
            }).catch(error => {
                BlocksoftCryptoLog.log('XrpTransferProcessor.submit error ' + error.toString())
                reject(error)
            })
        }).catch(error => {
            BlocksoftCryptoLog.log('XrpTransferProcessor.sign error ' + error.toString())
            reject('Invalid address')
        })

        BlocksoftCryptoLog.log('XrpTransferProcessor.sendTx result', result)

        if (result.resultCode === 'tecNO_DST_INSUF_XRP') {
            throw new Error(result.resultMessage) // not enough - could be replaced by translated
        } else if (result.resultCode === 'tecUNFUNDED_PAYMENT') {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE') // not enough to pay
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
