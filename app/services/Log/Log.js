/**
 * @version 0.9
 */
import crashlytics from '@react-native-firebase/crashlytics'
import { Dimensions, PixelRatio } from 'react-native'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import config from '@app/config/config'
import { strings } from '@app/services/i18n'
import { FileSystem } from '@app/services/FileSystem/FileSystem'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

const DEBUG = config.debug.appLogs // set true to see usual logs in console
const DEBUG_DAEMON = config.debug.appDaemonLogs // set true to see cron jobs logs in console

const MAX_MESSAGE = 2000
const FULL_MAX_MESSAGE = 20000

const LOGS_TXT = {
    DAEMON: '',
    TEST : '',
    ALL: ''
}

const FULL_LOGS_TXT = {
    DAEMON: '',
    TEST : '',
    ALL: ''
}

class Log {

    constructor() {
        this.FS = {
            TEST: new FileSystem({ fileEncoding: 'utf8', fileName: 'TestLog', fileExtension: 'txt' }),
            DAEMON: new FileSystem({ fileEncoding: 'utf8', fileName: 'DaemonLog', fileExtension: 'txt' }),
            ALL: new FileSystem({ fileEncoding: 'utf8', fileName: 'AppLog', fileExtension: 'txt' })
        }

        this.DATA = {}

        this.TG_MSG = ''
    }

    async _reinitTgMessage(testerMode, obj, msg) {

        for (const key in obj) {
            this.DATA[key] = obj[key]
        }

        this.TG_MSG = msg

        await this.FS.TEST.checkOverflow()
        await this.FS.DAEMON.checkOverflow()
        await this.FS.ALL.checkOverflow()
    }

    _simpleStringify(object, replacer = null, space = '\t\t\t\t\t', level = 0) {
        const simpleObject = {}
        let setSimpleObject = false
        for (const prop in object) {
            // eslint-disable-next-line no-prototype-builtins
            if (!object.hasOwnProperty(prop)) {
                continue
            }
            if (typeof (object[prop]) === 'function') {
                continue
            }
            if (object[prop] === object) {
                continue
            }
            if (typeof object[prop] === 'object') {
                if (level > 1) {
                    continue
                }
                const tmp = this._simpleStringify(object[prop], replacer, space, level + 1)
                if (tmp) {
                    simpleObject[prop] = tmp
                }
            } else {
                simpleObject[prop] = object[prop]
                setSimpleObject = true
            }
        }
        if (level > 0) {
            return setSimpleObject ? simpleObject : false
        } else {
            return JSON.stringify(simpleObject, replacer, space) // returns cleaned up JSON
        }
    }

    async daemon(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
        return this.log(txtOrObj, txtOrObj2, txtOrObj3, 'DAEMON')
    }

    async test(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
        return this.log(txtOrObj, txtOrObj2, txtOrObj3, 'TEST')
    }

    errorTranslate(e, title, extend, additional = '') {
        const currencyCode = typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode

        additional +=  JSON.stringify(extend)

        if (e.message.indexOf('SERVER_RESPONSE_') === -1) {
            this.err(title + ' ' + currencyCode + ' error ' + e.message + ' ' + additional)
            return e
        }

        this.log(title + ' error logged ' + e.message + ' ' + additional)
        let newMessage = ''
        let params = {}
        if (typeof e.logData !== 'undefined') {
            params = e.logData
        }
        params.symbol = currencyCode
        if (typeof extend.transferProcessor !== 'undefined') {
            if (extend.transferProcessor === 'BNB_SMART' || extend.transferProcessor === 'BNB_SMART_20') {
                params.symbol = 'BNB Smart Chain'
            } else if (extend.transferProcessor === 'BNB') {
                params.symbol = 'BNB'
            }
        }
        try {
            newMessage = strings('send.errors.' + e.message, params)
        } catch (e2) {
            newMessage = strings(e.message, params)
        }
        if (newMessage.indexOf('translation') !== -1) {
            newMessage = strings(e.message, params)
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
    async log(txtOrObj, txtOrObj2 = false, txtOrObj3 = false, LOG_SUBTYPE = 'ALL', LOG_AS_ERROR = false, LOG_WRITE_FILE = true) {

        if (settingsActions.getSettingStatic('loggingCode') === 'none') {
            return
        }

        let line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        let line2 = ''
        if (txtOrObj && typeof txtOrObj !== 'undefined') {
            if (typeof txtOrObj === 'string') {
                line += ' ' + txtOrObj
            } else {
                line += ' ' + this._simpleStringify(txtOrObj, null, '\t')
            }
        }

        if (txtOrObj2 && typeof txtOrObj2 !== 'undefined') {
            if (typeof txtOrObj2 === 'string') {
                line += '\n\t\t\t\t\t' + txtOrObj2
            } else if (txtOrObj2 === {}) {
                line += ' {} '
            } else if (typeof txtOrObj2.sourceURL === 'undefined') {
                line += '\n\t\t\t\t\t' + this._simpleStringify(txtOrObj2, null, '\t\t\t\t\t')
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
                crashlytics().log('==========ERROR ' + LOG_SUBTYPE + '==========')
            }
            if (LOG_WRITE_FILE) {
                await this.FS[LOG_SUBTYPE].writeLine('==========ERROR ' + LOG_SUBTYPE + '==========')
            }
        }
        if (!config.debug.appErrors && config.debug.firebaseLogs) {
            // noinspection JSUnresolvedFunction
            crashlytics().log(line)
        }
        if (LOG_WRITE_FILE) {
            await this.FS[LOG_SUBTYPE].writeLine(line)
        }


        if (txtOrObj3 && typeof txtOrObj3 !== 'undefined') {
            if (typeof txtOrObj3 === 'string') {
                line2 += '\t\t\t\t\t' + txtOrObj3
            } else {
                line2 += '\t\t\t\t\t' + this._simpleStringify(txtOrObj3, null, '\t\t\t\t\t')
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
                crashlytics().log(line2)
            }
            if (LOG_WRITE_FILE) {
                await this.FS[LOG_SUBTYPE].writeLine(line2)
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
        return this.err(errorObjectOrText, errorObject2, 'DAEMON')
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
                line += this._simpleStringify(errorObjectOrText)
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

        try {

            // noinspection JSUnresolvedFunction
            if (LOG_WRITE_FILE) {
                await this.FS[LOG_SUBTYPE].writeLine('FRNT ' + line)
            }

            if (!config.debug.appErrors) {
                const e = new Error('FRNT_2021_02 ' + line)
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

    getHeaders() {
        let msg = `\n\n\n\n=================================\n\nVERSION ${config.version.code + ' ' + config.version.hash}`
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

        try {
            msg += '\n\nDB VERSION ' + settingsActions.getSettingStatic('dbVersion')
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
