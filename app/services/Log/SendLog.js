/**
 * @version 0.11
 */
import Log from './Log'
import { FileSystem } from '../FileSystem/FileSystem'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'
import { getSqlForExport, cleanupNotNeeded } from '@app/appstores/DataSource/Database'
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
            await cleanupNotNeeded()
            sql = await getSqlForExport()
        } catch (e) {
            // do nothing again
        }
        let logs = `

                ↑↑↑ Send to: contact@trustee.deals ↑↑↑

                ${deviceToken}

                ${basicText}

                --LOG--
                ${Log.getHeaders()}

                --SQL--
                ${sql}
            `

        let zipFsError = false
        let zipFs
        try {
            const line = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '-').replace(/:/, '-').replace(/:/, '-')
            zipFs = new FileSystem({ baseDir: 'zip', fileName: 'logs-' + line, fileExtension: 'zip' })
            logs += '\n\nSIZES ' + await zipFs.countDir()
        } catch (e) {
            zipFsError = true
            Log.err('APPLOG ZIP Error ' + e.message)
        }
        if (true || zipFsError || !FilePermissions.isOk()) { //4 beta
            // @ts-ignore
            Log.errFS(FilePermissions.getError())
            return {
                title: 'Trustee. Support',
                subject: 'Trustee. Support',
                email: 'contact@trustee.deals',
                message: logs
            }
        }

        const fs = new FileSystem({ fileEncoding: 'utf8', fileName: 'SQL', fileExtension: 'txt' })
        await fs.writeFile(logs)

        let tmp = Log.FS.ALL.getError()
        if (tmp && tmp !== '') {
            Log.errFS('APPLOG ' + tmp)
        }

        tmp = Log.FS.DAEMON.getError()
        if (tmp && tmp !== '') {
            Log.errFS('DAEMONLOG ' + tmp)
        }

        tmp = BlocksoftCryptoLog.FS.getError()
        if (tmp && tmp !== '') {
            Log.errFS('CRYPTOLOG ' + tmp)
        }

        let urls = []
        if (!zipFsError) {
            try {
                try {
                    await zipFs.cleanDir()
                } catch (e) {
                    // do nothing
                }

                const zipped = await this.actualZip(fs, zipFs)
                Log.log('SendLog zip success ' + JSON.stringify(zipped))
                urls = [
                    await zipFs.getPathOrBase64()
                ]
                zipFsError = false
            } catch (e) {
                zipFsError = true
            }
        }
        if (zipFsError) {
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
