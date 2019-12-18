import { BlocksoftKeysStorage } from '../BlocksoftKeysStorage/BlocksoftKeysStorage'

class BlocksoftKeysForRefStorage extends BlocksoftKeysStorage {

    constructor(_serviceName = 'BlocksoftKeysRefStorage'){
        super(_serviceName)
    }

    async getPublicAndPrivateResultForHash(hash) {
        let res = await this._getKeyValue('cd_' + hash)
        if (!res && !res.priv) return false
        return JSON.parse(res.priv)
    }

    async setPublicAndPrivateResultForHash(hash, data) {
        return this._setKeyValue('cd_' + hash, hash, JSON.stringify(data))
    }

}

let singleBlocksoftKeysRefStorage = new BlocksoftKeysForRefStorage()

export default singleBlocksoftKeysRefStorage
