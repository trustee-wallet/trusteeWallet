import RNFS, { unlink } from 'react-native-fs'

//import Log from './Log/Log'

import { Platform } from 'react-native'


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

    constructor() {
        this._dirname = RNFS.DocumentDirectoryPath
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
            return 'data:text/plain;base64,' + res
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

    checkOverflow = async () => {
        let res
        try {
            const path = this.getPath()
            const backPath = path + '_back.txt'
            res = await RNFS.exists(path)
            if (!res) {
                return true
            }

            res = await RNFS.stat(path)
            if (res.size < 2000000) { // 2 mb
                return true
            }
            const back = await RNFS.exists(backPath)
            if (back) {
                await RNFS.unlink(backPath)
            }
            await RNFS.copyFile(path, backPath)
            await RNFS.unlink(path)

        } catch (e) {
            console.error('FileSystem.checkOverflow error ' + e.message)
            throw e
        }
        return res
    }

    writeLine = async (line) => {
        let res
        try {
            res = RNFS.appendFile(this.getPath(), line + '\n', this._fileEncoding)
        } catch (e) {
            console.error('FileSystem.writeLine error ' + e.message)
            throw e
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

    /**
     * @param {boolean} returnBase64
     * @returns {FileSystem}
     */
    setReturnBase64 = returnBase64 => {
        this._returnBase64 = returnBase64
        return this
    }
}

export default FileSystem
