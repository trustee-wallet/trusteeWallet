import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const CACHE_ERRORS_VALID_TIME = 60000 // 1 minute

const CACHE_ERRORS = {
    mainTime: 0,
    mainSecondTime: 0,
    mainThirdTime: 0,
    alternativeTime: 0
}

let CACHE_HISTORY = []

class BtcTransactionProvider {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcTransactionsProvider requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcTransactionsProvider requires settings.network')
        }
        switch (settings.network) {
            case 'dogecoin':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/doge/main`
                this._insightApiPath = false
                break
            case 'litecoin':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/ltc/main`
                this._insightApiPath = `https://insight.litecore.io/api/rawtx/`
                break
            case 'mainnet':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/main`
                this._insightApiPath = `https://insight.bitpay.com/api/rawtx/`
                break
            case 'testnet':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/test3`
                this._insightApiPath = `https://test-insight.bitpay.com/api/rawtx/`
                break
            default:
                throw new Error('while retrieving Bitcoin Fee Processor - unknown Bitcoin network specified. Got : ' + settings.network)
        }
    }


    /**
     * @param {string} hash
     * @return {Promise<[]>}
     * @private
     */
    async _getMain(hash) {
        if (!this._blockcypherApiPath) {
            return -1
        }
        let link = `${this._blockcypherApiPath}/txs/${hash}`
        CACHE_HISTORY.push(link)
        let tmp = await BlocksoftAxios.get(link)
        /**
         * @param {Array} tmp.data.hash
         * @param {string} tmp.data.vout[].spentTxId
         */
        if (!tmp.data || typeof tmp.data.hash === 'undefined') {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Undefined tx ' + link + ' ' + JSON.stringify(tmp.data))
        }
        let result = {
            txid: tmp.data.hash,
            vout: []
        }
        for (let output of tmp.data.outputs) {
            result.vout.push({
                spentTxId: output.spent_by,
                valueSat : output.value,
                address: typeof(output.addresses) === 'undefined' ? false : output.addresses[0]
            })
        }
        return result
    }

    /**
     * @param {string} hash
     * @return {Promise<[]>}
     */
    async getRaw(hash) { //not actually working for segwit tx
        if (!this._insightApiPath) {
            return -1
        }
        let link = `${this._insightApiPath}${hash}`
        CACHE_HISTORY.push(link)
        let tmp = await BlocksoftAxios.get(link)
        /**
         * @param {Array} tmp.data.txid
         * @param {string} tmp.data.vout[].n
         * @param {string} tmp.data.vout[].spentTxId
         */
        if (!tmp.data || typeof tmp.data.rawtx === 'undefined') {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Undefined tx ' + link + ' ' + JSON.stringify(tmp.data))
        }
        return tmp.data.rawtx
    }

    /**
     * @param hash
     * @return {Promise<[]|number>}
     */
    async get(hash) {
        CACHE_HISTORY = []
        let txs = -1
        let now = new Date().getTime()
        BlocksoftCryptoLog.log('BtcTransactionProvider.get started', hash)

        let msg = ''
        if (now - CACHE_ERRORS.mainTime > CACHE_ERRORS_VALID_TIME) {
            try {
                txs = await this._getMain(hash)
            } catch (e) {
                txs = -1
                CACHE_ERRORS.mainTime = now
                msg += ' ' + e.message
            }
        }

        /*if (now - CACHE_ERRORS.mainSecondTime > CACHE_ERRORS_VALID_TIME && txs === -1) {
            try {
                txs = await this._getMainSecond(hash)
            } catch (e) {
                txs = -1
                CACHE_ERRORS.mainSecondTime = now
                msg += ' ' + e.message
            }
        }*/

        if (txs === -1) {
            throw new Error('BtcTransactionProvider.get nothing responding ' + JSON.stringify(CACHE_HISTORY) + msg)
        }

        return txs
    }
}

module.exports.init = function (settings) {
    return new BtcTransactionProvider(settings)
}
