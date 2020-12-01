/**
 * Separated log class for crypto module - could be encoded here later
 * @version 0.9
 */
import firebase from 'react-native-firebase'

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
        this.FS = new FileSystem({fileEncoding : 'utf8', fileName : 'CryptoLog', fileExtension : 'txt'})

        this.DATA = {}
        this.DATA.LOG_VERSION = false

        this.TG_MSG = ''

        // noinspection JSIgnoredPromiseFromCall
        this.FS.checkOverflow()

    }

    _reinitTgMessage(testerMode, obj, msg) {

        if(testerMode === 'TESTER'){
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
    }

    log(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
        let line  = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
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
                line += '\n\t\t\t' + txtOrObj2
            } else if (typeof txtOrObj2.sourceURL === 'undefined') {
                line += '\n\t\t\t' + JSON.stringify(txtOrObj2, null, '\t\t\t')
            }
        }

        if(DEBUG) {
            console.log('CRYPTO ' + line)
        }

        // noinspection JSUnresolvedFunction
        if (!config.debug.cryptoErrors && config.debug.firebaseLogs) {
            firebase.crashlytics().log(line)
        }
        // noinspection JSIgnoredPromiseFromCall
        this.FS.writeLine(line)

        if (txtOrObj3 && typeof txtOrObj3 !== 'undefined') {
            if (typeof txtOrObj3 === 'string') {
                line2 += '\t\t\t' + txtOrObj3
            } else {
                line2 += '\t\t\t' + JSON.stringify(txtOrObj3, null, '\t\t\t')
            }
            // noinspection JSUnresolvedFunction
            if (!config.debug.cryptoErrors && config.debug.firebaseLogs) {
                firebase.crashlytics().log('\n', line2)
            }
            // noinspection JSIgnoredPromiseFromCall
            this.FS.writeLine(line2)
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

        this.log(errorObjectOrText, errorObject2)

        LOGS_TXT = '\n\n\n\n==========' + errorTitle + '==========\n\n\n\n' + LOGS_TXT
        // noinspection JSUnresolvedFunction
        if (!config.debug.cryptoErrors) {
            firebase.crashlytics().log('==========' + errorTitle + '==========')
        }
        // noinspection ES6MissingAwait
        this.FS.writeLine('==========' + errorTitle + '==========')


        if (errorObject2 && typeof errorObject2.code !== 'undefined' && errorObject2.code === 'ERROR_USER') {
            return true
        }

        let msg = `CRPT_SEPT_${this.DATA.LOG_VERSION}` + '\n' + date + line + '\n'
        if (msg) {
            msg += this.TG_MSG
        }

        try {
            // noinspection JSUnresolvedFunction
            this.FS.writeLine('CRPT_SEPT ' + line)
            if (!config.debug.cryptoErrors) {
                if (typeof firebase.crashlytics().recordCustomError !== 'undefined') {
                    firebase.crashlytics().recordCustomError('CRPT_SEPT', line, [])
                } else {
                    firebase.crashlytics().log('CRPT_SEPT ' + line)
                    // noinspection ES6MissingAwait
                    firebase.crashlytics().crash()
                }
            }
        } catch (firebaseError) {
            msg += ' Crashlytics error ' + firebaseError.message
        }

        let canSend = true
        if (typeof this.DATA.LOG_VERSION !== 'undefined') {
            const tmp = this.DATA.LOG_VERSION.toString().split(' ')
            if (typeof tmp[1] !== 'undefined') {
                const minVersion = await BlocksoftExternalSettings.get('minCryptoErrorsVersion', 'BlocksoftCryptoLog.error')
                if (minVersion * 1 > tmp[1] * 1) {
                    canSend = false
                }
            }
        }
        if (canSend) {
            this.TG.send('\n\n\n\n=========================================================\n\n\n\n' + msg + '\n' + FULL_LOGS_TXT)
        }

        return true
    }

    getLogs() {
        return FULL_LOGS_TXT
    }

    isNetworkError(message) {
        return (message.indexOf('Network Error') !== -1
            || message.indexOf('timeout of 0ms exceeded') !== -1
            || message.indexOf('Request failed with status code') !== -1
            || message.indexOf('API calls limits have been reached') !== -1
            || message.indexOf('SERVER_RESPONSE_') !== -1
        )
    }


}

export default new BlocksoftCryptoLog()
