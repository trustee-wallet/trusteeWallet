/**
 * @version 0.9
 */
import firebase from 'react-native-firebase'
import { Dimensions, PixelRatio } from 'react-native'

import BlocksoftTg from '../../../crypto/common/BlocksoftTg'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'

import config from '../../config/config'
import changeableProd from '../../config/changeable.prod'
import changeableTester from '../../config/changeable.tester'
import FileSystem from '../FileSystem/FileSystem'
import { strings } from '../i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

const DEBUG = config.debug.appLogs // set true to see usual logs in console
const DEBUG_DAEMON = config.debug.appDaemonLogs // set true to see cron jobs logs in console

const MAX_MESSAGE = 2000
const FULL_MAX_MESSAGE = 20000

const LOGS_TXT = {
    DAEMON: '',
    ALL: ''
}

const FULL_LOGS_TXT = {
    DAEMON: '',
    ALL: ''
}

class Log {

    constructor() {
        this.TG = new BlocksoftTg(changeableProd.tg.info.theBot, changeableProd.tg.info.appErrorsChannel)
        this.FS = {
            DAEMON: new FileSystem(),
            ALL: new FileSystem()
        }

        this.DATA = {}
        this.DATA.LOG_VERSION = false

        this.TG_MSG = ''

        this.FS.DAEMON.setFileEncoding('utf8').setFileName('DaemonLog').setFileExtension('txt')
        this.FS.DAEMON.checkOverflow()
        this.FS.ALL.setFileEncoding('utf8').setFileName('AppLog').setFileExtension('txt')
        this.FS.ALL.checkOverflow()
    }

    _reinitTgMessage(testerMode, obj, msg) {

        if (testerMode === 'TESTER') {
            this.TG.API_KEY = changeableTester.tg.info.theBot
            this.TG.CHAT = changeableTester.tg.info.appErrorsChannel
        } else {
            this.TG.API_KEY = changeableProd.tg.info.theBot
            this.TG.CHAT = changeableProd.tg.info.appErrorsChannel
        }

        for (const key in obj) {
            this.DATA[key] = obj[key]
        }

        this.TG_MSG = msg
    }

    consoleStart() {
        this.localConsole = true
    }

    consoleStop() {
        this.localConsole = false
    }

    daemonDiv() {
        if (DEBUG) {
            console.log('')
        }
    }


    simpleStringify(object, replacer, space) {
        const simpleObject = {}
        let prop
        for (prop in object) {
            // eslint-disable-next-line no-prototype-builtins
            if (!object.hasOwnProperty(prop)) {
                continue
            }
            if (typeof (object[prop]) === 'object') {
                continue
            }
            if (typeof (object[prop]) === 'function') {
                continue
            }
            simpleObject[prop] = object[prop]
        }
        return JSON.stringify(simpleObject, replacer, space) // returns cleaned up JSON
    }

    daemon(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
        this.log(txtOrObj, txtOrObj2, txtOrObj3, 'DAEMON')
    }

    errorTranslate(e, title, currencyCode, additional = '') {
        if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
            this.err(title + ' ' + currencyCode + ' error ' + e.message + ' ' + additional)
            return e
        }

        this.log(title + ' error logged ' + e.message + ' ' + additional)
        let newMessage = ''
        try {
            newMessage = strings('send.errors.' + e.message, { symbol: currencyCode })
        } catch (e2) {
            newMessage = strings(e.message, { symbol: currencyCode })
        }
        if (newMessage.indexOf('translation') !== -1) {
            newMessage = strings(e.message, { symbol: currencyCode })
        }
        e.message = newMessage
        return e
    }

    /**
     * @param {string|any} txtOrObj
     * @param {string|boolean|any} txtOrObj2
     * @param {string|boolean|any} txtOrObj3
     * @param {string} LOG_SUBTYPE
     * @param {string} LOG_AS_ERROR
     * @returns {boolean}
     */
    log(txtOrObj, txtOrObj2 = false, txtOrObj3 = false, LOG_SUBTYPE = 'ALL', LOG_AS_ERROR = false, LOG_WRITE_FILE = true) {
        let line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        let line2 = ''
        if (txtOrObj && typeof txtOrObj !== 'undefined') {
            if (typeof txtOrObj === 'string') {
                line += ' ' + txtOrObj
            } else {
                line += ' ' + this.simpleStringify(txtOrObj, null, '\t')
            }
        }
        if (txtOrObj2 && typeof txtOrObj2 !== 'undefined') {
            if (typeof txtOrObj2 === 'string') {
                line += '\n\t\t\t' + txtOrObj2
            } else if (typeof txtOrObj2.sourceURL === 'undefined') {
                line += '\n\t\t\t' + this.simpleStringify(txtOrObj2, null, '\t\t\t')
            }
        }


        if (LOG_SUBTYPE !== 'DAEMON') {
            if (DEBUG || this.localConsole) {
                if (LOG_AS_ERROR) {
                    console.log('\n\n\n\n==================ERROR ' + LOG_SUBTYPE + '====================\n\n\n\n' + line)
                } else {
                    console.log(line)
                }
            }
        } else if (DEBUG_DAEMON) {
            if (LOG_AS_ERROR) {
                console.log('\n\n\n\n==================ERROR ' + LOG_SUBTYPE + '====================\n\n\n\n' + line)
            } else {
                console.log('DAEMON ' + line)
            }
        }

        if (LOG_AS_ERROR) {
            if (!config.debug.appErrors) {
                // noinspection JSUnresolvedFunction
                firebase.crashlytics().log('==========ERROR ' + LOG_SUBTYPE + '==========')
            }
            if (LOG_WRITE_FILE) {
                this.FS[LOG_SUBTYPE].writeLine('==========ERROR ' + LOG_SUBTYPE + '==========')
            }
        }
        if (!config.debug.appErrors && config.debug.firebaseLogs) {
            // noinspection JSUnresolvedFunction
            firebase.crashlytics().log(line)
        }
        if (LOG_WRITE_FILE) {
            this.FS[LOG_SUBTYPE].writeLine(line)
        }


        if (txtOrObj3 && typeof txtOrObj3 !== 'undefined') {
            if (typeof txtOrObj3 === 'string') {
                line2 += '\t\t\t' + txtOrObj3
            } else {
                line2 += '\t\t\t' + this.simpleStringify(txtOrObj3, null, '\t\t\t')
            }
            if (LOG_SUBTYPE !== 'DAEMON') {
                if (DEBUG || this.localConsole) {
                    console.log('\n' + line2)
                }
            } else if (DEBUG_DAEMON) {
                console.log('\n' + line2)
            }
            if (!config.debug.appErrors && config.debug.firebaseLogs) {
                // noinspection JSUnresolvedFunction
                firebase.crashlytics().log(line2)
            }
            if (LOG_WRITE_FILE) {
                this.FS[LOG_SUBTYPE].writeLine(line2)
            }
        }

        if (LOG_AS_ERROR) {
            line = '\n\n\n\n==========ERROR ' + LOG_SUBTYPE + '==========\n\n\n\n' + line
        }
        LOGS_TXT[LOG_SUBTYPE] = line + line2 + '\n' + LOGS_TXT[LOG_SUBTYPE]
        FULL_LOGS_TXT[LOG_SUBTYPE] = line + line2 + '\n' + FULL_LOGS_TXT[LOG_SUBTYPE]
        if (LOGS_TXT[LOG_SUBTYPE].length > MAX_MESSAGE) {
            LOGS_TXT[LOG_SUBTYPE] = LOGS_TXT[LOG_SUBTYPE].substr(0, MAX_MESSAGE) + '...'
        }
        if (FULL_LOGS_TXT[LOG_SUBTYPE].length > FULL_MAX_MESSAGE) {
            FULL_LOGS_TXT[LOG_SUBTYPE] = FULL_LOGS_TXT[LOG_SUBTYPE].substr(0, FULL_MAX_MESSAGE) + '...'
        }

        if (LOG_SUBTYPE !== 'ALL') { // for DAEMON AND OTHER TYPES
            LOGS_TXT.ALL = ' >> ' + line + line2 + '\n' + LOGS_TXT.ALL
            FULL_LOGS_TXT.ALL = ' >> ' + line + line2 + '\n' + FULL_LOGS_TXT.ALL
            if (LOGS_TXT.ALL.length > MAX_MESSAGE) {
                LOGS_TXT.ALL = LOGS_TXT.ALL.substr(0, MAX_MESSAGE) + '...'
            }
            if (FULL_LOGS_TXT.ALL.length > FULL_MAX_MESSAGE) {
                FULL_LOGS_TXT.ALL = FULL_LOGS_TXT.ALL.substr(0, FULL_MAX_MESSAGE) + '...'
            }
        }
        return true
    }

    async errDaemon(errorObjectOrText, errorObject2) {
        this.err(errorObjectOrText, errorObject2, 'DAEMON')
    }

    async errFS(errorObjectOrText, errorObject2) {
        this.err(errorObjectOrText, errorObject2, 'ALL', false)
    }



    /**
     * @param {string|any} errorObjectOrText
     * @param {string|boolean|any} errorObject2
     * @param {string} LOG_SUBTYPE
     * @returns {Promise<boolean>}
     */
    async err(errorObjectOrText, errorObject2 = false, LOG_SUBTYPE = 'ALL', LOG_WRITE_FILE = true) {
        const now = new Date()
        const date = now.toISOString().replace(/T/, ' ').replace(/\..+/, '')
        let line = ''
        if (errorObjectOrText && typeof errorObjectOrText !== 'undefined') {
            if (typeof errorObjectOrText === 'string') {
                line += ' ' + errorObjectOrText
            } else if (typeof errorObjectOrText.message !== 'undefined' && errorObjectOrText.message && errorObjectOrText.message.length > 1) {
                if (typeof errorObjectOrText.code !== 'undefined') {
                    line += ' ' + errorObjectOrText.code + ' ' + errorObjectOrText.message
                } else {
                    line += ' ' + errorObjectOrText.message
                }
            } else {
                line += this.simpleStringify(errorObjectOrText)
            }
        }

        if (config.debug.appErrors || DEBUG) {
            console.log(`----------------ERROR ${LOG_SUBTYPE}-----------------`)
            console.log(date + line)
            if (errorObject2) {
                console.log(errorObject2)
            }
            return false
        }


        this.log(errorObjectOrText, errorObject2, false, LOG_SUBTYPE, true, LOG_WRITE_FILE)

        if (errorObject2 && typeof errorObject2.code !== 'undefined' && (errorObject2.code === 'ERROR_USER' || errorObject2.code === 'ERROR_NOTICE')) {
            return true
        }

        let msg = `FRNT_SEPT_${this.DATA.LOG_VERSION} ${LOG_SUBTYPE}` + '\n' + date + line + '\n'
        msg += this.TG_MSG

        try {

            // noinspection JSUnresolvedFunction
            if (LOG_WRITE_FILE) {
                this.FS[LOG_SUBTYPE].writeLine('FRNT ' + line)
            }

            if (!config.debug.appErrors) {
                if (typeof firebase.crashlytics().recordCustomError !== 'undefined') {
                    firebase.crashlytics().recordCustomError('FRNT_SEPT', line, [])
                } else {
                    firebase.crashlytics().log('FRNT_SEPT ' + line)
                    firebase.crashlytics().crash()
                }
            }
        } catch (firebaseError) {
            msg += ' Crashlytics error ' + firebaseError.message
        }

        // noinspection ES6MissingAwait

        let canSend = true
        if (typeof this.DATA.LOG_VERSION !== 'undefined') {
            const tmp = this.DATA.LOG_VERSION.toString().split(' ')
            if (typeof tmp[1] !== 'undefined') {
                const minVersion = await BlocksoftExternalSettings.get('minAppErrorsVersion', 'Log.error')
                if (minVersion * 1 > tmp[1] * 1) {
                    canSend = false
                }
            }
        }
        if (canSend) {
            this.TG.send('\n\n\n\n=========================================================\n\n\n\n' + msg + '\n' + LOGS_TXT[LOG_SUBTYPE])
        }

        return true
    }

    getLogs() {
        return FULL_LOGS_TXT.ALL
    }

    getHeaders() {
        let msg = `\n\n\n\n=================================\n\nVERSION_${this.DATA.LOG_VERSION}`
        if (msg) {
            msg += '\n\n' + this.TG_MSG
        }
        try {
            const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
            msg += '\n\nSCREEN ' + SCREEN_WIDTH + ' x ' + SCREEN_HEIGHT
        } catch (e) {

        }
        try {
            msg += '\n\nPIXELS ' + PixelRatio.get()
        } catch (e) {

        }
        return msg
    }

    isNetworkError(msg) {
        const message = msg.toLowerCase()
        if (message.indexOf('ui_') === 0) {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: strings('modal.exchange.errors.' + msg)
            })
            return true
        }
        return (message.indexOf('network error') !== -1
            || message.indexOf('timeout') !== -1
            || message.indexOf('request failed with status code') !== -1
            || message.indexOf('calls limits have been reached') !== -1
            || message.indexOf('server_response_') !== -1
        )
    }

}

export default new Log()
