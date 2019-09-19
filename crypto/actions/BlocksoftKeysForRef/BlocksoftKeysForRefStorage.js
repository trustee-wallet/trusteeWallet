import { BlocksoftKeysStorage } from '../BlocksoftKeysStorage/BlocksoftKeysStorage'

class BlocksoftKeysForRefStorage extends BlocksoftKeysStorage {


    constructor(_serviceName = 'BlocksoftKeysRef'){
        super(_serviceName)
    }
}

let singleBlocksoftKeysRefStorage = new BlocksoftKeysForRefStorage()

export default singleBlocksoftKeysRefStorage
