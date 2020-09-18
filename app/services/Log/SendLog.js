/**
 * @version 0.11
 */
import Log from './Log'
import FileSystem from '../FileSystem/FileSystem'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'
import DBExport from '../../appstores/DataSource/DB/DBExport/DBExport'
import AsyncStorage from '@react-native-community/async-storage'

import { zip } from 'react-native-zip-archive'
import FilePermissions from '../FileSystem/FilePermissions'

class SendLog {
    async getAll(basicText = '') {
        let deviceToken = ''
        let sql = ''
        try {
            deviceToken = await AsyncStorage.getItem('allPushTokens')
        } catch (e) {
            // do nothing
        }
        try {
            sql = await DBExport.getSql()
        } catch (e) {
            // do nothing again
        }
        const logs = `    
          
                ↑↑↑ Send to: contact@trustee.deals ↑↑↑
                
                ${deviceToken}
                 
                ${basicText}
                
                --LOG-- 
                ${Log.getHeaders()} 
                                
                --SQL-- 
                ${sql}
            `

        if (!FilePermissions.isOk()) {
            return {
                title: 'Trustee. Support',
                subject: 'Trustee. Support',
                email: 'contact@trustee.deals',
                message: logs
            }
        }

        const fs = new FileSystem()
        await (fs.setFileEncoding('utf8').setFileName('SQL').setFileExtension('txt')).writeFile(logs)

        const zipFs = new FileSystem('zip')
        await zipFs.cleanDir()
        const line = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '-').replace(/:/, '-').replace(/:/, '-')
        zipFs.setFileName('logs-' + line).setFileExtension('zip')
        try {
            await zipFs.cleanDir()
        } catch (e) {
            // do nothing
        }

        let urls = []
        try {
            const zipped = await this.actualZip(fs, zipFs)
            Log.log('SendLog zip success ' + JSON.stringify(zipped))
            urls = [
                await zipFs.getPathOrBase64()
            ]
        } catch (e) {
            Log.log('SendLog zip error ' + e.message)
            urls = [
                await fs.getPathOrBase64(),
                await Log.FS.ALL.getPathOrBase64(),
                await Log.FS.DAEMON.getPathOrBase64(),
                await BlocksoftCryptoLog.FS.getPathOrBase64()
            ]
        }

        const shareOptions = {
            title: 'Trustee. Support',
            subject: 'Trustee. Support',
            email: 'contact@trustee.deals',
            message: '↑↑↑ Send to: contact@trustee.deals ↑↑↑',
            urls
        }
        return shareOptions
    }

    async actualZip(fs, zipFs) {
        return new Promise((resolve, reject) => {
            zip(fs.getDir(), zipFs.getPath())
                .then((path) => {
                    resolve(path)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }
}

export default new SendLog()
