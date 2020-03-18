/**
 * @author Ksu
 * @version 0.5
 */
import { BlocksoftKeysStorage } from '../BlocksoftKeysStorage/BlocksoftKeysStorage'

class BlocksoftKeysForRefStorage extends BlocksoftKeysStorage {

    constructor(_serviceName = 'BlocksoftKeysRefStorage') {
        super(_serviceName)
    }

    async getPublicAndPrivateResultForHash(hash) {
        const res = await this._getKeyValue('cd_' + hash)
        if (!res && !res.priv) return false
        return JSON.parse(res.priv)
    }

    async setPublicAndPrivateResultForHash(hash, data) {
        return this._setKeyValue('cd_' + hash, hash, JSON.stringify(data))
    }

}

const singleBlocksoftKeysRefStorage = new BlocksoftKeysForRefStorage()
export default singleBlocksoftKeysRefStorage
