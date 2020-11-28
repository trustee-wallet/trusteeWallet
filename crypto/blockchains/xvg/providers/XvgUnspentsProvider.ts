/**
 * @version 0.20
 * https://api.vergecurrency.network/node/api/XVG/mainnet/address/DL5LtSf7wztH45VuYunL8oaQHtJbKLCHyw/txs/?unspent=true
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

export default class XvgUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    _apiPath = 'https://api.vergecurrency.network/node/api/XVG/mainnet/address/'

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
    }

    async getUnspents(address: string): Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XvgUnspentsProvider.getUnspents started', address)

        const link = this._apiPath + address + '/txs/?unspent=true'
        const res = await BlocksoftAxios.getWithoutBraking(link)
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' XvgUnspentsProvider.getUnspents link', link)
        if (!res || typeof res.data === 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' XvgUnspentsProvider.getUnspents nothing loaded for address ' + address + ' link ' + link)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (!res.data || typeof res.data[0] === 'undefined') {
            return []
        }
        const sortedUnspents = []
        /**
         * https://api.vergecurrency.network/node/api/XVG/mainnet/address/DL5LtSf7wztH45VuYunL8oaQHtJbKLCHyw/txs/?unspent=true
         * @param {*} res.data[]
         * @param {string} res.data[]._id "5e0b42fb746f4c73717c1d1d"
         * @param {string} res.data[].chain "XVG"
         * @param {string} res.data[].network "mainnet"
         * @param {string} res.data[].coinbase false
         * @param {string} res.data[].mintIndex 1
         * @param {string} res.data[].spentTxid
         * @param {string} res.data[].mintTxid "50aae03bec6662a277c6e03ff2c58a200912e1bb78519d8403354c66c4d51892"
         * @param {string} res.data[].mintHeight 3715825
         * @param {string} res.data[].spentHeight
         * @param {string} res.data[].address "DL5LtSf7wztH45VuYunL8oaQHtJbKLCHyw"
         * @param {string} res.data[].script "76a914a3d43334ff9ea4c257a1796b63e4fa8330747d2e88ac"
         * @param {string} res.data[].value 91523000
         * @param {string} res.data[].confirmations -1
         */
        const already = {}
        let unspent
        for (unspent of res.data) {
            if (typeof already[unspent.mintTxid] === 'undefined' || already[unspent.mintTxid] > unspent.value) {
                sortedUnspents.push({
                    txid: unspent.mintTxid,
                    vout: unspent.mintIndex,
                    value: unspent.value.toString(),
                    height: unspent.mintHeight,
                    confirmations: 1,
                    isRequired: false
                })
                already[unspent.mintTxid] = unspent.value
            }
        }
        return sortedUnspents
    }
}
