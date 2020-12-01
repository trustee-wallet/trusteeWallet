/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'

class BlocksoftTokenChecks {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}

    /**
     * @type {{tokenType, tokenAddress}}
     * @private
     */
    _data = {}

    /**
     * @param {string} tokenType
     * @return {BlocksoftTokenChecks}
     */
    setTokenType(tokenType) {
        this._data.tokenType = tokenType
        if (!this._processor[tokenType]) {
            this._processor[tokenType] = BlocksoftDispatcher.getTokenProcessor(tokenType)
        }
        return this
    }

    /**
     * @param {string} tokenAddress
     * @return {BlocksoftTokenChecks}
     */
    setTokenAddress(tokenAddress) {
        this._data.tokenAddress = tokenAddress
        return this
    }


    async getTokenDetails() {
        try {
            return this._processor[this._data.tokenType].getTokenDetails(this._data.tokenAddress)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
    }

}

const singleBlocksoftTokenChecks = new BlocksoftTokenChecks()
export default singleBlocksoftTokenChecks
