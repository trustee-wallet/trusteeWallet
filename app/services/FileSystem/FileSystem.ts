/**
 * @version 0.21
 */
import RNFS from 'react-native-fs'
import ImageResizer from 'react-native-image-resizer'

import { Platform } from 'react-native'
import FilePermissions from './FilePermissions'

const CACHE_ERROR = {
    time: 0,
    txt: ''
}
const CACHE_VALID_TIME_PAUSE = 10000

export class FileSystem {

    coreDirname: string = ''

    _fileDir: string = ''

    _fileName: string = ''

    _fileExtension: string = ''

    _fileEncoding: string = ''

    _fileDate: string = ''

    _withDate: boolean = false

    constructor(params: {
        baseDir: string,
        fileEncoding: string,
        fileName: string,
        fileExtension: string,
        withDate: boolean
    }) {
        if (RNFS.DocumentDirectoryPath) {
            this.coreDirname = RNFS.DocumentDirectoryPath
        } else {
            this.coreDirname = RNFS.CachesDirectoryPath
        }
        this._fileDir = this.coreDirname + '/' + (params.baseDir || 'logs')
        this._fileEncoding = params.fileEncoding || 'base64'
        this._fileName = params.fileName || 'noName'
        if (params.withDate) {
            this._fileDate = new Date().toISOString().split('T')[0]
            this._withDate = params.withDate
        }
        this._fileExtension = params.fileExtension || 'txt'
    }

    writeFile = async (content: string): Promise<void> => {
        try {
            await RNFS.writeFile(this.getPath(), content, this._fileEncoding)
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.writeFile error ' + e.message
            throw e
        }
    }

    getPathOrBase64 = async (forceFileContent = false): Promise<string> => {
        let res
        try {
            if (Platform.OS === 'android' || forceFileContent) {
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
        if (this._withDate) {
            return `${this._fileDir}/${this._fileName}.${this._fileDate}.${this._fileExtension}`
        } else {
            return `${this._fileDir}/${this._fileName}.${this._fileExtension}`
        }
    }

    cleanFile = async (): Promise<void> => {
        try {
            await RNFS.unlink(this.getPath())
        } catch (e) {
            // do nothing
        }
    }

    cleanDir = async (): Promise<void> => {
        const items = await RNFS.readDir(this._fileDir)
        if (!items) return
        for (const item of items) {
            await RNFS.unlink(item.path)
        }
    }

    countDir = async (): Promise<string> => {
        const items = await RNFS.readDir(this._fileDir)
        if (!items) return 'empty'
        let txt = ''
        for (const item of items) {
            const res = await RNFS.stat(item.path)
            txt += '\n\n ' + item.path + ' size ' + res.size
        }
        return txt
    }

    checkOverflow = async (): Promise<void> => {
        if (!FilePermissions.isOk()) {
            return
        }
        let path = ''
        try {
            path = this.getPath()
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.checkOverflow getPath error ' + e.message
            return
        }
        if (!this._withDate) {
            try {
                if (!await RNFS.exists(path)) {
                    return
                }
                const res = await RNFS.stat(path)
                if (res.size * 1 > 7000000) { // 7 mb
                    RNFS.unlink(path)
                }
            } catch (e) {
                CACHE_ERROR.txt = 'ERROR!!! FS.checkOverflow withDate=false check error  ' + e.message
                return
            }
            return
        }
        this._fileDate = new Date().toISOString().split('T')[0]

        const items = await RNFS.readDir(this._fileDir)
        if (!items) return

        const line = new Date().toISOString().split('T')[0]
        const line2 = new Date(new Date() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const line3 = new Date(new Date() - 48 * 60 * 60 * 1000).toISOString().split('T')[0]
        const line4 = new Date(new Date() - 72 * 60 * 60 * 1000).toISOString().split('T')[0]
        const needKeepFilesArray = {}
        // @ts-ignore
        needKeepFilesArray[this._fileName + '.' + line + '.' + this._fileExtension] = 1
        // @ts-ignore
        needKeepFilesArray[this._fileName + '.' + line2 + '.' + this._fileExtension] = 1
        // @ts-ignore
        needKeepFilesArray[this._fileName + '.' + line3 + '.' + this._fileExtension] = 1
        // @ts-ignore
        needKeepFilesArray[this._fileName + '.' + line4 + '.' + this._fileExtension] = 1

        for (const item of items) {
            if (item.name.indexOf(this._fileName) === 0) {
                // @ts-ignore
                if (typeof needKeepFilesArray[item.name] === 'undefined') {
                    try {
                        await RNFS.unlink(item.path)
                    } catch (e) {
                        CACHE_ERROR.txt = 'ERROR!!! FS.checkOverflow withDate=true unlink error  ' + e.message
                    }
                }
            }
        }
    }

    writeLine = async (line: string): Promise<void> => {
        if (!FilePermissions.isOk()) {
            return
        }
        if (line.indexOf('appendFile') !== -1 || line.indexOf('RNFS') !== -1) {
            return
        }
        const now = new Date().getTime()
        if (now - CACHE_ERROR.time < CACHE_VALID_TIME_PAUSE) {
            return
        }
        try {
            // console.log('FILE ' + this.getPath() + ' ' + line)
            await RNFS.appendFile(this.getPath(), line + '\n', this._fileEncoding)
        } catch (e) {
            CACHE_ERROR.time = now
            CACHE_ERROR.txt = 'ERROR!!! FS.writeLine error ' + e.message
        }
    }

    getDir(): string {
        return this._fileDir
    }

    handleImageBase64 = async (path: string) => {
        let res
        try {
            const resizedImageUrl = await ImageResizer.createResizedImage(path, 1920, 1080, 'JPEG', 100, 0, this.coreDirname)
            res = await RNFS.readFile(resizedImageUrl.uri, 'base64')
        } catch (e) {
            CACHE_ERROR.txt = 'ERROR!!! FS.handleImageBase64 error ' + e.message
        }
        return res
    }

    v3handleImageBase64 = async (path: string) => {
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
