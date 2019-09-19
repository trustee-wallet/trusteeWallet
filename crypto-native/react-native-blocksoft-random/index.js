import { NativeModules } from 'react-native'

const { RNBlocksoftRandom } = NativeModules

const getRandomBytes = async (size) => {
    return RNBlocksoftRandom.getRandomBytesPublic(size)
}

export {
    RNBlocksoftRandom, getRandomBytes
}
