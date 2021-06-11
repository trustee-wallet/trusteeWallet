/**
 * @version 0.11
 */
import RNFS from 'react-native-fs'
let IS_OK = false

let CACHE_ERROR = ''
class FilePermissions {

    init = async () => {
        try {
            const root = RNFS.DocumentDirectoryPath ? RNFS.DocumentDirectoryPath : RNFS.CachesDirectoryPath
            if (!root) {
                throw new Error('no root directory')
            }
            if (!await RNFS.exists(root + '/logs')) {
                await RNFS.mkdir(root + '/logs')
                await RNFS.mkdir(root + '/zip')
            }

            IS_OK = true
        } catch (e) {
            CACHE_ERROR = ' ERROR!!! FilePermissions.createDir error ' + e.message + ' ' + JSON.stringify({caches : RNFS.CachesDirectoryPath, docs : RNFS.DocumentDirectoryPath})
        }
    }

    isOk() {
        return IS_OK
    }

    getError() {
        return CACHE_ERROR
    }
}

export default new FilePermissions()
