// noinspection NpmUsedModulesInstalled
const createHash = require('create-hash')
// noinspection NpmUsedModulesInstalled
const createHmac = require('create-hmac')

const createHmacPDFK2Sizes = { md5: 16, sha1: 20, sha224: 28, sha256: 32, sha384: 48, sha512: 64, rmd160: 20, ripemd160: 20 }

const DEFAULT_WORDS = require('./_words/english.json')


class BlocksoftKeysUtils {
    static recheckMnemonic(mnemonic) {
        let words = mnemonic.trim().toLowerCase().split(/\s+/g)
        let checked = []
        for (let word of words) {
            if (!word || word.length < 2) continue
            // noinspection JSUnresolvedFunction
            let index = DEFAULT_WORDS.indexOf(word)
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

    static bip39MnemonicToSeed(mnemonic, password) {
        function salt(password) {
            return 'mnemonic' + (password || '')
        }

        function pbkdf2(password, salt, iterations, keylen, digest) {

            digest = digest || 'sha1'

            let DK = Buffer.allocUnsafe(keylen)
            let block1 = Buffer.allocUnsafe(salt.length + 4)
            salt.copy(block1, 0, 0, salt.length)

            let destPos = 0
            let hLen = createHmacPDFK2Sizes[digest]
            let l = Math.ceil(keylen / hLen)

            for (let i = 1; i <= l; i++) {
                block1.writeUInt32BE(i, salt.length)

                // noinspection JSUnresolvedFunction
                let T = createHmac(digest, password).update(block1).digest()
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


        const mnemonicBuffer = Buffer.from((mnemonic || ''), 'utf8')
        const saltBuffer = Buffer.from(salt(password || ''), 'utf8')
        return pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512')
    }
}

export default BlocksoftKeysUtils
