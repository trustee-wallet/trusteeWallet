/**
 * @version 0.11
 */
import RNFS from 'react-native-fs'
let IS_OK = false

let CACHE_ERROR = ''
class FilePermissions {

    init = async () => {
        try {
            if (RNFS.CachesDirectoryPath) {
                await RNFS.mkdir(RNFS.CachesDirectoryPath + '/logs')
                await RNFS.mkdir(RNFS.CachesDirectoryPath + '/zip')
            } else {
                await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/logs')
                await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/zip')
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
