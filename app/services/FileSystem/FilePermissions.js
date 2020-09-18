/**
 * @version 0.11
 */
import RNFS from 'react-native-fs'

let IS_OK = false

class FilePermissions {

    init = async () => {
        try {
            await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/logs')
            await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/zip')
            IS_OK = true
        } catch (e) {
            console.error('FilePermissions.createDir error ' + e.message)
        }
    }

    isOk() {
        return IS_OK
    }
}

export default new FilePermissions()
