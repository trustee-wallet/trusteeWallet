/**
 * @author Ksu
 * @version 0.11
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'

const Dispatcher = new BlocksoftDispatcher()

class BlocksoftSecrets {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}
    /**
     * @type {{currencyCode}}
     * @private
     */
    _data = {}

    /**
     * @type {{mnemonic}}
     * @private
     */
    _privateData = {}


    /**
     * @param {string} currencyCode
     * @return {BlocksoftSecrets}
     */
    setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode
        if (!this._processor[currencyCode]) {
            /**
             * @type {XmrSecretsProcessor}
             */
            this._processor[currencyCode] = Dispatcher.getSecretsProcessor(currencyCode)
        }
        return this
    }


    /**
     * @param {string} mnemonic
     * @return {BlocksoftSecrets}
     */
    setMnemonic(mnemonic) {
        this._privateData.mnemonic = mnemonic
        return this
    }

    /**
     * @return {Promise<{hash}>}
     */
    async getWords() {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res = ''
        try {
            BlocksoftCryptoLog.log(`BlocksoftSecrets.getWords ${currencyCode} started`)
            res = await this._processor[currencyCode].getWords(this._privateData)
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
