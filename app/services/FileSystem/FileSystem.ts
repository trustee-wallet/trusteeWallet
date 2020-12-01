/**
 * @version 0.21
 */
import RNFS from 'react-native-fs'
import ImageResizer from 'react-native-image-resizer'

import { Platform } from 'react-native'
import FilePermissions from './FilePermissions'

const CACHE_ERROR = {
    time : 0,
    txt : ''
}
const CACHE_VALID_TIME_PAUSE = 10000

export class FileSystem {

    coreDirname: string = ''

    _fileDir: string = ''

    _fileName: string = ''

    _fileExtension: string = ''

    _fileEncoding: string = ''

    constructor(params : {
                    baseDir : string,
                    fileEncoding: string,
                    fileName : string,
                    fileExtension : string
     }) {
        if (RNFS.CachesDirectoryPath) {
            this.coreDirname = RNFS.CachesDirectoryPath
        } else {
            this.coreDirname = RNFS.DocumentDirectoryPath
        }
        this._fileDir = this.coreDirname + '/' + (params.baseDir || 'logs')
        this._fileEncoding = params.fileEncoding || 'base64'
        this._fileName = params.fileName || 'noName'
        this._fileExtension = params.fileExtension || 'txt'
    }

    deleteFile = async (): Promise<void> => {
        try {
            await RNFS.unlink(this.getPath())
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.deleteFile error ' + e.message
            throw e
        }
    }

    writeFile = async (content: string): Promise<void> => {
        try {
            await RNFS.writeFile(this.getPath(), content, this._fileEncoding)
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.writeFile error ' + e.message
            throw e
        }
    }

    getPathOrBase64 = async (): Promise<string> => {
        let res
        try {
            if (Platform.OS === 'android') {
                res = await RNFS.readFile(this.getPath(), 'base64')
                let type = 'data:text/plain'
                if (this._fileExtension === 'zip') {
                    type = 'data:application/zip'
                }
                res = type + ';base64,' + res
            } else {
                res = await this.getPath()
            }
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.getPathOrBase64 error ' + e.message
            throw e
        }
        return res
    }

    getPath = (): string => {
        return `${this._fileDir}/${this._fileName}.${this._fileExtension}`
    }

    cleanDir = async (): Promise<void> => {
        const items = await RNFS.readDir(this._fileDir)
        if (!items) return
        let item
        for (item of items) {
            await RNFS.unlink(item.path)
        }
    }

    checkOverflow = async (): Promise<void> => {
        try {
            const path = this.getPath()
            if (!await RNFS.exists(path)) {
                return
            }
            const res = await RNFS.stat(path)
            // @ts-ignore
            if (res.size < 700000) { // 0.7 mb
                return
            }
            await RNFS.unlink(path)
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.checkOverflow error ' + e.message
        }
    }

    writeLine = async (line: string): Promise<void> => {
        if (!FilePermissions.isOk()) {
            return
        }
        if (line.indexOf('appendFile') !== -1) {
            return
        }
        const now = new Date().getTime()
        if (now - CACHE_ERROR.time < CACHE_VALID_TIME_PAUSE) {
            return
        }
        try {
            await RNFS.appendFile(this.getPath(), line + '\n', this._fileEncoding)
        } catch (e) {
            CACHE_ERROR.time = now
            CACHE_ERROR.txt = 'ERROR!!! FS.writeLine error ' + e.message
        }
    }

    getDir() : string {
        return this._fileDir
    }

    handleImageBase64 = async (path : string) => {
        let res
        try {
            const resizedImageUrl = await ImageResizer.createResizedImage(path, 1920, 1080, 'JPEG', 100, 0, this.coreDirname)
            res = await RNFS.readFile(resizedImageUrl.uri, 'base64')
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.handleImageBase64 error ' + e.message
        }
        return res
    }

    v3handleImageBase64 = async (path : string) => {
        let res
        try {
            const resizedImageUrl = await ImageResizer.createResizedImage(path, 1920, 1080, 'JPEG', 80, 0, this.coreDirname)
            res = await RNFS.readFile(resizedImageUrl.uri, 'base64')
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.handleImageBase64 error ' + e.message
        }
        return res
    }

    getError() {
        return CACHE_ERROR.txt
    }
}
