/**
 * https://testnet.smartbit.com.au/api
 * https://www.smartbit.com.au/api
 *
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'


class BtcTxDataProvider {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcTxDataProvider requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcTxDataProvider requires settings.network')
        }
        switch (settings.network) {
            case 'litecoin':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/ltc/main`
                this._smartbitApiPath = false
                break
            case 'mainnet':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/main`
                this._smartbitApiPath = `https://api.smartbit.com.au/v1`
                break
            case 'testnet':
                this._isMainSkipped = true
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/test3`
                this._smartbitApiPath = `https://testnet-api.smartbit.com.au/v1`
                break
            default:
                throw new Error('while retrieving Bitcoin Fee Processor - unknown Bitcoin network specified. Got : ' + settings.network)
        }
    }

    /**
     * @param {string} hash
     * @return {Promise<{unspents: Array, balance:number}>}
     * @private
     */
    async _getAlternative(hash) {
        if (!this._smartbitApiPath) {
            return -1
        }
        let link = `${this._smartbitApiPath}/blockchain/tx/${hash}`
        let getData
        try {
            getData = await BlocksoftAxios.get(link)
            getData = getData.data
        } catch (e) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxDataProvider. _getAlternative ' + link, e)
            throw e
        }
        if (!getData.transaction || !getData.transaction.inputs || !getData.transaction.inputs.length) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxDataProvider. _getAlternative ' + link + ' !getData.transaction', getData)
            throw new Error('Undefined tx')
        }
        let unspents = []
        let balance = 0
        for (let input of getData.transaction.inputs) {
            unspents.push({
                value : input.value_int,
                txId: input.txid,
                vout: input.vout
            })
            balance += input.value_int * 1
        }

        return {unspents, balance}
    }

    /**
     * @param hash
     * @return {Promise<{unspents: Array, balance: number}>}
     * @private
     */
    async _getMain(hash) {
        let link = `${this._blockcypherApiPath}/txs/${hash}`

        let getData
        try {
            getData = await BlocksoftAxios.get(link)
            getData = getData.data
            BlocksoftCryptoLog.log('BtcTxDataProvider._getMain ' + link + ' gotData', getData)
        } catch (e) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxUnspentsProvider._getMain ' + link, e)
            throw e
        }
        if (!getData || !getData.inputs || !getData.inputs.length) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxDataProvider. _getMain ' + link + ' !getData', getData)
            throw new Error('Undefined tx')
        }

        let unspents = []
        let balance = 0
        for (let input of getData.inputs) {
            unspents.push({
                value : input.output_value,
                txId: input.prev_hash,
                vout: input.output_index
            })
            balance += input.output_value * 1
        }

        return {unspents, balance}
    }

    /**
     * @param {string} hash
     * @return {Promise<{unspents: Array, balance: number}>}
     */
    async get(hash) {
        let getData
        if (this._isMainSkipped) {
            getData= await this._getAlternative(hash)
            BlocksoftCryptoLog.log('BtcTxDataProvider.get for ' + hash + ' Alternative Results', getData)
        } else {
            try {
                getData = await this._getMain(hash)
                BlocksoftCryptoLog.log('BtcTxDataProvider.get for ' + hash + ' Main Results', getData)
            } catch (e) {
                getData = await this._getAlternative(hash)
                BlocksoftCryptoLog.log('BtcTxDataProvider.get for ' + hash + ' Alternative Results', getData)
            }
        }
        return getData
    }
}

module.exports.init = function(settings) {
    return new BtcTxDataProvider(settings)
}
