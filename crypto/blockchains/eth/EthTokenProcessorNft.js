/**
 * @version 0.50
 */
import EthBasic from './basic/EthBasic'
import EthNftOpensea from '@crypto/blockchains/eth/apis/EthNftOpensea'
import EthNftMatic from '@crypto/blockchains/eth/apis/EthNftMatic'
import abi from './ext/erc721.js'
import config from '@app/config/config'
import BlocksoftDictNfts from '@crypto/common/BlocksoftDictNfts'

export default class EthTokenProcessorNft extends EthBasic {


    /**
     * @param data.address
     * @param data.tokenBlockchainCode
     */
    async getListBlockchain(data) {

        const settings = BlocksoftDictNfts.NftsIndexed[data.tokenBlockchainCode]
        if (
           typeof settings !== 'undefined' && typeof settings.apiType !== 'undefined' && settings.apiType === 'OPENSEA'
        ) {
            return EthNftOpensea(data)
        } else {
            return EthNftMatic(data)
        }
    }

    async getNftDetails(nftAddress, nftType) {
        this.checkWeb3CurrentServerUpdated()

        let token, name, symbol
        try {
            token = new this._web3.eth.Contract(abi.ERC721, nftAddress.toLowerCase())
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('EthTokenProcessorNft erc721 init token error ' + e.message)
            }
            e.message = 'erc721 init token ' + e.message
            throw e
        }

        // @todo more checks!
        try {
            name = await token.methods.name().call()
        } catch (e) {
            name = nftAddress.substr(0, 32)
        }

        try {
            symbol = await token.methods.symbol().call()
        } catch (e) {
            symbol = name.substr(0, 5)
        }

        const res = {
            nftSymbol: symbol,
            nftCode: symbol,
            nftName: name,
            nftType: nftType,
            nftAddress: nftAddress.toLowerCase(),
            provider: 'web3'
        }
        return res
    }
}
