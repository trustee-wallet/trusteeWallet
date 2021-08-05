/**
 * @version 0.20
 *
 * https://bsv.btc.com/api-doc#Unspent
 * https://bsv-chain.api.btc.com/v3/address/15urYnyeJe3gwbGJ74wcX89Tz7ZtsFDVew/unspent
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'

export default class BsvUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    _apiPath = 'https://bsv-chain.api.btc.com/v3'

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
    }

    async getUnspents(address: string): Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvUnspentsProvider.getUnspents started', address)

        const link = `${this._apiPath}/address/${address}/unspent`
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || typeof res.data === 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvUnspentsProvider.getUnspents nothing loaded for address ' + address + ' link ' + link)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        if (!res.data || typeof res.data.data === 'undefined' || !res.data.data || typeof res.data.data.list === 'undefined' || !res.data.data.list) {
            return []
        }
        const sortedUnspents = []
        /**
         * https://bsv-chain.api.btc.com/v3/address/15urYnyeJe3gwbGJ74wcX89Tz7ZtsFDVew/unspent
         * @param {*} res.data.data.list[]
         * @param {string} res.data.data.list[].tx_hash "04ffa9c3875b15ceb65c2dd4ee2654c5fb65374123692362e32fac566a6b16aa"
         * @param {string} res.data.data.list[].tx_output_n 0
         * @param {string} res.data.data.list[].tx_output_n2
         * @param {string} res.data.data.list[].value 100000000
         * @param {string} res.data.data.list[].confirmations 147916
         */
        let unspent
        for (unspent of res.data.data.list) {
            sortedUnspents.push({
                txid: unspent.tx_hash,
                vout: typeof unspent.tx_output_n === 'undefined' ? 0 : unspent.tx_output_n,
                value: unspent.value.toString(),
                height: 0,
                confirmations : unspent.confirmations,
                isRequired : false
            })
        }
        return sortedUnspents
    }
}
