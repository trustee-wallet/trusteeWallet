/**
 * @author Ksu
 * @version 0.5
 */
const createHash = require('create-hash')
const {pbkdf2} = require('react-native-fast-crypto')

const DEFAULT_WORDS = require('./_words/english.json')

class BlocksoftKeysUtils {

    static recheckMnemonic(mnemonic) {
        const words = mnemonic.trim().toLowerCase().split(/\s+/g)
        const checked = []
        let word
        for (word of words) {
            if (!word || word.length < 2) continue
            // noinspection JSUnresolvedFunction
            const index = DEFAULT_WORDS.indexOf(word)
            if (index === -1) {
                throw new Error('BlocksoftKeysStorage invalid word ' + word)
            }
            checked.push(word)
        }
        if (checked.length <= 11) {
            throw new Error('BlocksoftKeysStorage invalid words length ' + mnemonic)
        }
        return checked.join(' ')
    }

    /**
     * make hash for mnemonic string
     * @param {string} mnemonic
     * @return {string}
     */
    static hashMnemonic(mnemonic) {
        // noinspection JSUnresolvedFunction
        return createHash('sha256').update(mnemonic).digest('hex').substr(0, 32)
    }

    static async bip39MnemonicToSeed(mnemonic, password) {
        if (!mnemonic) {
            throw new Error('bip39MnemonicToSeed is empty')
        }

        function salt(password) {
            return 'mnemonic' + (password || '')
        }

        const mnemonicBuffer = Buffer.from((mnemonic || ''), 'utf8')
        const saltBuffer = Buffer.from(salt(password || ''), 'utf8')
        const tmp2 = await pbkdf2.deriveAsync(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512')
        return Buffer.from(tmp2)
    }
}

export default BlocksoftKeysUtils
