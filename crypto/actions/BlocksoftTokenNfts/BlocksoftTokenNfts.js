/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'

class BlocksoftTokenNfts {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}

    /**
     *
     * @param data.tokenBlockchainCode
     * @param data.address
     */
    async getList(data) {
        try {
            if (!this._processor[data.tokenBlockchainCode]) {
                this._processor[data.tokenBlockchainCode] = BlocksoftDispatcher.getTokenNftsProcessor(data.tokenBlockchainCode)
            }
            return this._processor[data.tokenBlockchainCode].getListBlockchain(data)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
    }

}

const singleBlocksoftTokenNfts = new BlocksoftTokenNfts()
export default singleBlocksoftTokenNfts
