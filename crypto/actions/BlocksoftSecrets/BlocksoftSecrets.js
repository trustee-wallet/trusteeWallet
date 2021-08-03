/**
 * @author Ksu
 * @version 0.11
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'

class BlocksoftSecrets {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}

    /**
     * @param {string} params.currencyCode
     * @param {string} params.mnemonic
     * @return {Promise<{hash}>}
     */
    async getWords(params) {
        const currencyCode = params.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }

        if (!this._processor[currencyCode]) {
            /**
             * @type {XmrSecretsProcessor}
             */
            this._processor[currencyCode] = BlocksoftDispatcher.getSecretsProcessor(currencyCode)
        }

        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftSecrets.getWords ${currencyCode} started`)
            res = await this._processor[currencyCode].getWords(params)
            BlocksoftCryptoLog.log(`BlocksoftSecrets.getWords ${currencyCode} finished`)
        } catch (e) {
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err(`BlocksoftSecrets.getWords ${currencyCode} error ` + e.message, e.data ? e.data : e)
            throw e
        }

        return res
    }
}

const singleBlocksoftSecrets = new BlocksoftSecrets()

export default singleBlocksoftSecrets
