/**
 * Separated log class for crypto module - could be encoded here later
 * @version 0.9
 */
import crashlytics from '@react-native-firebase/crashlytics'

import BlocksoftExternalSettings from './BlocksoftExternalSettings'

import config from '@app/config/config'
import { FileSystem } from '@app/services/FileSystem/FileSystem'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

const DEBUG = config.debug.cryptoLogs // set true to see usual logs in console

const MAX_MESSAGE = 2000
const FULL_MAX_MESSAGE = 20000

let LOGS_TXT = ''
let FULL_LOGS_TXT = ''

class BlocksoftCryptoLog {

    constructor() {
        this.FS = new FileSystem({ fileEncoding: 'utf8', fileName: 'CryptoLog', fileExtension: 'txt' })

        this.DATA = {}
        this.DATA.LOG_VERSION = false
    }

    async _reinitTgMessage(testerMode, obj, msg) {

        for (const key in obj) {
            this.DATA[key] = obj[key]
        }

        // noinspection JSIgnoredPromiseFromCall
        await this.FS.checkOverflow()
    }

    async log(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
        if (settingsActions.getSettingStatic('loggingCode') === 'none') {
            return
        }
        let line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        let line2 = ''
        if (txtOrObj && typeof txtOrObj !== 'undefined') {
            if (typeof txtOrObj === 'string') {
                line += ' ' + txtOrObj
            } else {
                line += ' ' + JSON.stringify(txtOrObj, null, '\t')
            }
        }
        if (txtOrObj2 && typeof txtOrObj2 !== 'undefined') {
            if (typeof txtOrObj2 === 'string') {
                line += '\n\t\t\t\t\t' + txtOrObj2
            } else if (txtOrObj2 === {}) {
                line += ' {} '
            } else if (typeof txtOrObj2.sourceURL === 'undefined') {
                line += '\n\t\t\t\t\t' + JSON.stringify(txtOrObj2, null, '\t\t\t\t\t')
            }
        }

        if (DEBUG) {
            console.log('CRYPTO ' + line)
        }

        if (!config.debug.cryptoErrors && config.debug.firebaseLogs) {
            crashlytics().log(line)
        }
        await this.FS.writeLine(line)

        if (txtOrObj3 && typeof txtOrObj3 !== 'undefined') {
            if (typeof txtOrObj3 === 'string') {
                line2 += '\t\t\t\t\t' + txtOrObj3
            } else {
                line2 += '\t\t\t\t\t' + JSON.stringify(txtOrObj3, null, '\t\t\t\t\t')
            }
            if (!config.debug.cryptoErrors && config.debug.firebaseLogs) {
                crashlytics().log('\n', line2)
            }
            await this.FS.writeLine(line2)
        }

        LOGS_TXT = line + line2 + '\n' + LOGS_TXT
        if (LOGS_TXT.length > MAX_MESSAGE) {
            LOGS_TXT = LOGS_TXT.substr(0, MAX_MESSAGE) + '...'
        }

        FULL_LOGS_TXT = line + line2 + '\n' + FULL_LOGS_TXT
        if (FULL_LOGS_TXT.length > FULL_MAX_MESSAGE) {
            FULL_LOGS_TXT = LOGS_TXT.substr(0, FULL_MAX_MESSAGE) + '...'
        }

        return true
    }

    async err(errorObjectOrText, errorObject2 = '', errorTitle = 'ERROR') {
        const now = new Date()
        const date = now.toISOString().replace(/T/, ' ').replace(/\..+/, '')
        let line = ''
        if (errorObjectOrText && typeof errorObjectOrText !== 'undefined') {
            if (typeof errorObjectOrText === 'string') {
                line += ' ' + errorObjectOrText
            } else if (typeof errorObjectOrText.code !== 'undefined') {
                line += ' ' + errorObjectOrText.code + ' ' + errorObjectOrText.message
            } else {
                line += ' ' + errorObjectOrText.message
            }
        }

        if (errorObject2 && typeof errorObject2 !== 'undefined' && errorObject2 !== '' && typeof errorObject2.message !== 'undefined') {
            line += ' ' + errorObject2.message
        }

        if (config.debug.cryptoErrors || DEBUG) {
            console.log('==========CRPT ' + errorTitle + '==========')
            console.log(date + line)
            if (errorObject2) {
                console.log('error', errorObject2)
            }
            return false
        }

        await this.log(errorObjectOrText, errorObject2)

        LOGS_TXT = '\n\n\n\n==========' + errorTitle + '==========\n\n\n\n' + LOGS_TXT
        // noinspection JSUnresolvedFunction
        if (!config.debug.cryptoErrors) {
            crashlytics().log('==========' + errorTitle + '==========')
        }
        // noinspection ES6MissingAwait
        await this.FS.writeLine('==========' + errorTitle + '==========')


        if (errorObject2 && typeof errorObject2.code !== 'undefined' && errorObject2.code === 'ERROR_USER') {
            return true
        }

        try {
            await this.FS.writeLine('CRPT_2021_02 ' + line)
            if (!config.debug.cryptoErrors) {
                const e = new Error('CRPT_2021_02 ' + line)
                if (typeof crashlytics().recordError !== 'undefined') {
                    crashlytics().recordError(e)
                } else {
                    crashlytics().crash()
                }
                MarketingEvent.reinitCrashlytics()
            }
        } catch (firebaseError) {

        }

        return true
    }

}

export default new BlocksoftCryptoLog()
