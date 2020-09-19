/**
 * @version 0.9
 */
import RNFS, { unlink } from 'react-native-fs'
import ImageResizer from 'react-native-image-resizer'

import { Platform } from 'react-native'
import FilePermissions from './FilePermissions'


class FileSystem {

    /**
     * @type string
     * @private
     */
    _dirname = null

    /**
     * @type string
     * @private
     */
    _fileName = null

    /**
     * @type string
     * @private
     */
    _fileExtension = null

    /**
     * @type string
     * @private
     */
    _fileEncoding = null

    /**
     * @type boolean
     * @private
     */
    _returnBase64 = false

    constructor(baseDir = 'logs') {
        this._dirname = RNFS.DocumentDirectoryPath + '/' + baseDir
    }


    writeFile = async (content) => {
        let res
        try {
            res = await RNFS.writeFile(this.getPath(), content, this._fileEncoding)
        } catch (e) {
            console.error('FileSystem.writeFile error ' + e.message)
            throw e
        }

        return res
    }

    getPathOrBase64 = async () => {
        if (Platform.OS === 'android') {
            const res = await this.getBase64()
            let type = 'data:text/plain'
            if (this._fileExtension === 'zip') {
                type = 'data:application/zip'
            }
            return type + ';base64,' + res
        } else {
            return this.getPath()
        }
    }

    getBase64 = async () => {
        let res
        try {
            res = await RNFS.readFile(this.getPath(), 'base64')
        } catch (e) {
            console.error('FileSystem.getBase64 error ' + e.message)
            throw e
        }
        return res
    }

    getPath = () => {
        const {
            _dirname,
            _fileName,
            _fileExtension
        } = this

        return `${_dirname}/${_fileName}.${_fileExtension}`
    }

    cleanDir = async () => {
        const items = await RNFS.readDir(this._dirname)
        if (!items) return
        let item
        for (item of items) {
            await RNFS.unlink(item.path)
        }
        return true
    }

    remove = async () => {
        let res
        try {
            const path = this.getPath()
            res = await RNFS.exists(path)
            if (!res) {
                return true
            }
            await RNFS.unlink(path)
        } catch (e) {
            console.error('FileSystem.remove error ' + e.message)
        }
        return res
    }

    checkOverflow = async () => {
        let res
        try {
            const path = this.getPath()
            res = await RNFS.exists(path)
            if (!res) {
                return true
            }
            res = await RNFS.stat(path)
            if (res.size < 700000) { // 0.7 mb
                return true
            }
            await RNFS.unlink(path)
        } catch (e) {
            console.error('FileSystem.checkOverflow error ' + e.message)
        }
        return res
    }

    writeLine = async (line) => {
        if (!FilePermissions.isOk()) {
            return false
        }
        if (line.indexOf('appendFile') !== -1) {
            return false
        }
        let res
        try {
            res = RNFS.appendFile(this.getPath(), line + '\n', this._fileEncoding)
        } catch (e) {
            console.error('FileSystem.writeLine error ' + e.message)
        }
        return res
    }

    /**
     * @param {string} fileName
     * @returns {FileSystem}
     */
    setFileName = fileName => {
        this._fileName = fileName
        return this
    }

    /**
     * @param {string} fileExtension
     * @returns {FileSystem}
     */
    setFileExtension = fileExtension => {
        this._fileExtension = fileExtension
        return this
    }

    /**
     * @param {string} fileEncoding
     * @returns {FileSystem}
     */
    setFileEncoding = fileEncoding => {
        this._fileEncoding = fileEncoding
        return this
    }

    getDir() {
        return this._dirname
    }

    /**
     * @param {boolean} returnBase64
     * @returns {FileSystem}
     */
    setReturnBase64 = returnBase64 => {
        this._returnBase64 = returnBase64
        return this
    }

    handleImageBase64 = async (path) => {
        console.log(path)
        const resizedImageUrl = await ImageResizer.createResizedImage(path, 1920, 1080, 'JPEG', 100, 0, RNFS.DocumentDirectoryPath)
        return RNFS.readFile(resizedImageUrl.uri, 'base64')
    }
}


export default FileSystem
