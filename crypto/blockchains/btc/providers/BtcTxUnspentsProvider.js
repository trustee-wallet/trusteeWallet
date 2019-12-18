/**
 * https://testnet.smartbit.com.au/api
 * https://www.smartbit.com.au/api
 *
 * @typedef {Object} UnifiedTxRefs
 * @property {*} balance
 * @property {*} txrefs
 * @property {*} txrefs[].tx_hash
 * @property {*} txrefs[].tx_output_n
 * @property {*} txrefs[].value
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

class BtcTxUnspentsProvider {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcTxUnspentsProvider requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcTxUnspentsProvider requires settings.network')
        }
        switch (settings.network) {
            case 'dogecoin':
                this._isMainSkipped = false
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/doge/main`
                this._smartbitApiPath = false
                break
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
     * @param {string} address
     * @return {Promise<UnifiedTxRefs>}
     * @private
     */
    async _getAlternative(address) {
        if (!this._smartbitApiPath) {
            return -1
        }
        let link = `${this._smartbitApiPath}/blockchain/address/${address}/unspent?limit=100`
        let getUtxs
        try {
            getUtxs = await BlocksoftAxios.get(link)
        } catch (e) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxUnspentsProvider. _getAlternative ' + link, e)
            throw e
        }
        let prepared = []
        /**
         * @param {*} getUtxs.data.unspent
         * @param {string} getUtxs.data.unspent[].value_int
         * @param {string} getUtxs.data.unspent[].txid
         * @param {string} getUtxs.data.unspent[].n
         */
        for (let unspent of getUtxs.data.unspent) {
            prepared.push({
                value: unspent.value_int,
                tx_hash: unspent.txid,
                tx_output_n: unspent.n,
                isConfirmed: (unspent.confirmations > 0)
            })
        }
        return { txrefs: prepared }
    }

    async _getMain(address) {
        let link = `${this._blockcypherApiPath}/addrs/${address}?unspentOnly=true`

        let prepared
        try {
            /**
             * @param {Array} getUtxs.data.txrefs
             * @param {Array} getUtxs.data.unconfirmed_txrefs
             */
            let getUtxs = await BlocksoftAxios.get(link)
            prepared = []
            //// SOME UNCONFIRMED WE DO NEED WHEN SLOW BLOCKCHAIN
            if (typeof getUtxs.data.txrefs != 'undefined') {
                for (let tx of getUtxs.data.txrefs) {
                    tx.isConfirmed = true
                    prepared.push(tx)
                }
            }
            if (typeof getUtxs.data.unconfirmed_txrefs != 'undefined') {
                for (let tx of getUtxs.data.unconfirmed_txrefs) {
                    tx.isConfirmed = false
                    prepared.push(tx)
                }
            }
            BlocksoftCryptoLog.log('BtcTxUnspentsProvider._getMain ' + link + ' got txrefs', prepared)
        } catch (e) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            BlocksoftCryptoLog.err('BtcTxUnspentsProvider._getMain ' + link, e)
            throw e
        }

        return { txrefs: prepared }
    }

    async get(address) {
        let getUtxs
        if (this._isMainSkipped) {
            getUtxs = await this._getAlternative(address)
            BlocksoftCryptoLog.log('BtcTxUnspentsProvider.get for ' + address + ' Alternative Results', getUtxs)
        } else {
            try {
                getUtxs = await this._getMain(address)
                BlocksoftCryptoLog.log('BtcTxUnspentsProvider.get for ' + address + ' Main Results', getUtxs)
            } catch (e) {
                getUtxs = await this._getAlternative(address)
                BlocksoftCryptoLog.log('BtcTxUnspentsProvider.get for ' + address + ' Alternative Results', getUtxs)
            }
        }
        return getUtxs
    }
}

module.exports.init = function(settings) {
    return new BtcTxUnspentsProvider(settings)
}
