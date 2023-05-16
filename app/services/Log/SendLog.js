/**
 * @version 0.11
 */
import Log from './Log'
import { FileSystem } from '../FileSystem/FileSystem'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'
import { getSqlForExport, cleanupNotNeeded } from '@app/appstores/DataSource/Database'

import { zip } from 'react-native-zip-archive'
import FilePermissions from '../FileSystem/FilePermissions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

class SendLog {
    async getAll(basicText = '', params = {}) {
        const forceFileContent = typeof params.forceFileContent !== 'undefined' ? forceFileContent : false
        let deviceToken = ''
        try {
            deviceToken = trusteeAsyncStorage.getFcmTokensAll()
        } catch (e) {
            // do nothing
        }

        const logs = `

                ↑↑↑ Send to: contact@trustee.deals ↑↑↑

                GENERATED: ${new Date().toISOString()}
                ${JSON.stringify(deviceToken)}

                ${JSON.stringify(basicText)}

                --LOG--
                ${Log.getHeaders()}
                
            `
        let zipFsError = false
        let zipFs
        let fs
        let logSizes = ''
        try {
            const line = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '-').replace(/:/, '-').replace(/:/, '-')
            zipFs = new FileSystem({ baseDir: 'zip', fileName: 'logs-' + line, fileExtension: 'zip' })
            fs = new FileSystem({ fileEncoding: 'utf8', fileName: 'SQL', fileExtension: 'txt' })
            await fs.cleanFile()
        } catch (e) {
            zipFsError = true
            Log.err('APPLOG ZIP Error ' + e.message)
        }

        if (zipFsError || !FilePermissions.isOk()) {
            // @ts-ignore
            Log.errFS(FilePermissions.getError())
            return {
                title: 'Trustee. Support',
                subject: 'Trustee. Support',
                email: 'contact@trustee.deals',
                message: logs
            }
        }

        try {
            await fs.writeFile(logs)
            await cleanupNotNeeded()
            await getSqlForExport(fs)
        } catch (e) {
            // do nothing again
        }

        logSizes = '\n\nSIZES ' + await fs.countDir()

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
                    await zipFs.getPathOrBase64(forceFileContent)
                ]
                zipFsError = false
            } catch (e) {
                zipFsError = true
            }
        }
        if (zipFsError) {
            urls = [
                await fs.getPathOrBase64(forceFileContent),
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
