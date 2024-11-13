/**
 * @author Ksu
 * @version 0.5
 */
import { BlocksoftKeysStorage } from '../BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

class BlocksoftKeysForRefStorage extends BlocksoftKeysStorage {

    constructor(_serviceName = 'BlocksoftKeysRefStorage') {
        super(_serviceName)
    }

    async getPublicAndPrivateResultForHash(hash) {
        try {
            const res = await this._getKeyValue('cd_' + hash)
            if (!res && !res.priv) return false
            return JSON.parse(res.priv)
        } catch (e) {
            await BlocksoftCryptoLog.log('BlocksoftKeysForRefStorage error ' + e.message)
            return false
        }
    }

    async setPublicAndPrivateResultForHash(hash, data) {
        return this._setKeyValue('cd_' + hash, hash, JSON.stringify(data))
    }

}

const singleBlocksoftKeysRefStorage = new BlocksoftKeysForRefStorage()
export default singleBlocksoftKeysRefStorage
