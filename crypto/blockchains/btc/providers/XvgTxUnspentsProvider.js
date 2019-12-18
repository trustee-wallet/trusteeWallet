/**
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


class XvgTxUnspentsProvider {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('XvgTxUnspentsProvider requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('XvgTxUnspentsProvider requires settings.network')
        }
        this._xvgApiPath = ' https://api.vergecurrency.network/node/api/XVG/mainnet'
    }

    /**
     * @param {string} address
     * @return {Promise<UnifiedTxRefs>}
     * @private
     */
    async _getMain(address) {
        let link = `${this._xvgApiPath}/address/${address}/txs/?unspent=true`
        let getUtxs
        try {
            getUtxs = await BlocksoftAxios.get(link)
        } catch (e) {
            BlocksoftCryptoLog.err('XvgTxUnspentsProvider._getMain ' + link, e)
            throw e
        }
        let prepared = []
        /**
         * @param {*} getUtxs.data[]
         * @param {string} getUtxs.data[].mintTxid
         * @param {string} getUtxs.data[].value
         * @param {string} getUtxs.data[].spentHeight
         */
        for (let unspent of getUtxs.data) {
            prepared.push({
                value: unspent.value,
                tx_hash: unspent.mintTxid,
                tx_output_n: unspent.mintIndex,
                isConfirmed: true
            })

        }
        return { txrefs: prepared }
    }

    async get(address) {
        let getUtxs = await this._getMain(address)
        BlocksoftCryptoLog.log('XvgTxUnspentsProvider.get for ' + address + ' Results', getUtxs)
        return getUtxs
    }
}

module.exports.init = function(settings) {
    return new XvgTxUnspentsProvider(settings)
}
