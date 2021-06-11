const createHash = require('create-hash')

class BlocksoftCryptoUtils {

    static sha256(stringHex) {
       return createHash('sha256').update(stringHex, 'hex').digest('hex')
    }

}

export default BlocksoftCryptoUtils
