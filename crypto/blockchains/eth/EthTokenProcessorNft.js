/**
 * @version 0.50
 */
import EthBasic from './basic/EthBasic'
import EthNftOpensea from '@crypto/blockchains/eth/apis/EthNftOpensea'
import EthNftMatic from '@crypto/blockchains/eth/apis/EthNftMatic'

export default class EthTokenProcessorNft extends EthBasic {


    /**
     * @param data.address
     * @param data.tokenBlockchainCode
     */
    async getListBlockchain(data) {

        if (this._settings.tokenBlockchain === 'MATIC') {
            return EthNftMatic(data)
        } else {
            return EthNftOpensea(data)
        }
    }
}
