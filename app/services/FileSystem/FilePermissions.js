/**
 * @version 0.11
 */
import RNFS from 'react-native-fs'
import Log from '../Log/Log'
let IS_OK = false

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
            Log.errFS('ERROR!!! FilePermissions.createDir error ' + e.message, {caches : RNFS.CachesDirectoryPath, docs : RNFS.DocumentDirectoryPath})
        }
    }

    isOk() {
        return IS_OK
    }
}

export default new FilePermissions()
