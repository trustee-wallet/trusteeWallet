/**
 * @author Ksu
 * @version 0.5
 */
const createHash = require('create-hash')
const createHmac = require('create-hmac')

const createHmacPDFK2Sizes = {
    md5: 16,
    sha1: 20,
    sha224: 28,
    sha256: 32,
    sha384: 48,
    sha512: 64,
    rmd160: 20,
    ripemd160: 20
}

const {pbkdf2} = require('react-native-fast-crypto')

const DEFAULT_WORDS = require('./_words/english.json')

class BlocksoftKeysUtils {

    static _pbkdf2(password, salt, iterations, keylen, digest) {

        digest = digest || 'sha1'

        const DK = Buffer.allocUnsafe(keylen)
        const block1 = Buffer.allocUnsafe(salt.length + 4)
        salt.copy(block1, 0, 0, salt.length)

        let destPos = 0
        const hLen = createHmacPDFK2Sizes[digest]
        const l = Math.ceil(keylen / hLen)

        for (let i = 1; i <= l; i++) {
            block1.writeUInt32BE(i, salt.length)

            // noinspection JSUnresolvedFunction
            const T = createHmac(digest, password).update(block1).digest()
            let U = T

            for (let j = 1; j < iterations; j++) {
                // noinspection JSUnresolvedFunction
                U = createHmac(digest, password).update(U).digest()
                for (let k = 0; k < hLen; k++) T[k] ^= U[k]
            }

            T.copy(DK, destPos)
            destPos += hLen
        }

        return DK
    }

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
        try {
            const tmp2 = await pbkdf2.deriveAsync(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512')
            return Buffer.from(tmp2)
        } catch (e) {
            return BlocksoftKeysUtils._pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512')
        }
    }
}

export default BlocksoftKeysUtils
