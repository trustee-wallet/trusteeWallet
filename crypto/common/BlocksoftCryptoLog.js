/**
 * Separated log class for crypto module - could be encoded here later
 * @version 0.9
 */
import crashlytics from '@react-native-firebase/crashlytics'

import BlocksoftTg from './BlocksoftTg'
import BlocksoftExternalSettings from './BlocksoftExternalSettings'

import config from '../../app/config/config'
import changeableProd from '../../app/config/changeable.prod'
import changeableTester from '../../app/config/changeable.tester'
import { FileSystem } from '../../app/services/FileSystem/FileSystem'

const DEBUG = config.debug.cryptoLogs // set true to see usual logs in console

const MAX_MESSAGE = 2000
const FULL_MAX_MESSAGE = 20000

let LOGS_TXT = ''
let FULL_LOGS_TXT = ''

class BlocksoftCryptoLog {

    constructor() {
        this.TG = new BlocksoftTg(changeableProd.tg.info.theBot, changeableProd.tg.info.cryptoErrorsChannel)
        this.FS = new FileSystem({ fileEncoding: 'utf8', fileName: 'CryptoLog', fileExtension: 'txt' })

        this.DATA = {}
        this.DATA.LOG_VERSION = false

        this.TG_MSG = ''
    }

    async _reinitTgMessage(testerMode, obj, msg) {

        if (testerMode === 'TESTER') {
            this.TG.API_KEY = changeableTester.tg.info.theBot
            this.TG.CHAT = changeableTester.tg.info.cryptoErrorsChannel
        } else {
            this.TG.API_KEY = changeableProd.tg.info.theBot
            this.TG.CHAT = changeableProd.tg.info.cryptoErrorsChannel
        }

        for (const key in obj) {
            this.DATA[key] = obj[key]
        }

        this.TG_MSG = msg

        // noinspection JSIgnoredPromiseFromCall
        await this.FS.checkOverflow()
    }

    async log(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
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

        let msg = `CRPT_2021_02_${this.DATA.LOG_VERSION}` + '\n' + date + line + '\n'
        if (msg) {
            msg += this.TG_MSG
        }

        try {
            await this.FS.writeLine('CRPT_2021_02 ' + line)
            if (!config.debug.cryptoErrors) {
                if (typeof crashlytics().recordError !== 'undefined') {
                    const e = new Error('CRPT_2021_02 ' + line)
                    e.stack = line
                    crashlytics().recordError(e)
                } else {
                    crashlytics().log('CRPT_2021_02 ' + line)
                    crashlytics().crash()
                }
            }
        } catch (firebaseError) {
            msg += ' Crashlytics error ' + firebaseError.message
        }

        let canSend = true
        if (typeof this.DATA.LOG_VERSION !== 'undefined') {
            if (this.DATA.LOG_VERSION.indexOf('VERSION_CODE_PLACEHOLDER') !== -1) {
                canSend = false
            } else {
                const tmp = this.DATA.LOG_VERSION.toString().split(' ')
                if (typeof tmp[1] !== 'undefined') {
                    const minVersion = await BlocksoftExternalSettings.get('minCryptoErrorsVersion', 'BlocksoftCryptoLog.error')
                    if (minVersion * 1 > tmp[1] * 1) {
                        canSend = false
                    }
                }
            }
        }
        if (canSend) {
            this.TG.send('\n\n\n\n=========================================================\n\n\n\n' + msg + '\n' + FULL_LOGS_TXT)
        }

        return true
    }

}

export default new BlocksoftCryptoLog()
