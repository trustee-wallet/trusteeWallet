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
     *
     * @param data.tokenType
     * @param data.tokenAddress
     * @returns {Promise<{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: *, description: *, tokenType: string, currencyCode: *}|boolean|{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: boolean, description: boolean, tokenType: string, currencyCode: *}|*|undefined>}
     */
    async getTokenDetails(data) {
        try {
            if (!this._processor[data.tokenType]) {
                this._processor[data.tokenType] = BlocksoftDispatcher.getTokenProcessor(data.tokenType)
            }
            return this._processor[data.tokenType].getTokenDetails(data.tokenAddress)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
    }

}

const singleBlocksoftTokenChecks = new BlocksoftTokenChecks()
export default singleBlocksoftTokenChecks
