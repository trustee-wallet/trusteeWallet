import firebase from 'react-native-firebase'

import BlocksoftTg from '../../../crypto/common/BlocksoftTg'

import config from '../../config/config'
import changeableProd from '../../config/changeable.prod'
import changeableTester from '../../config/changeable.tester'

const DEBUG = config.debug.appLogs // set true to see usual logs in console
const DEBUG_DAEMON = config.debug.appDaemonLogs // set true to see cron jobs logs in console

const MAX_MESSAGE = 2000
const FULL_MAX_MESSAGE = 20000

let LOGS_TXT = {
    DAEMON: '',
    ALL: ''
}

let FULL_LOGS_TXT = {
    DAEMON: '',
    ALL: ''
}

class Log {

    constructor() {
        this.TG = new BlocksoftTg(changeableProd.tg.info.appBot)
    }

    _reinitTgMessage(testerMode, obj) {

        if(testerMode === 'TESTER'){
            this.TG.API_KEY = changeableTester.tg.info.appBot
        } else {
            this.TG.API_KEY = changeableProd.tg.info.appBot
        }

        this.LOG_VERSION = obj.LOG_VERSION
        this.LOG_TESTER = obj.LOG_TESTER
        this.LOG_DEV = obj.LOG_DEV
        this.LOG_WALLET = obj.LOG_WALLET
        this.LOG_CASHBACK = obj.LOG_CASHBACK
        this.LOG_TOKEN = obj.LOG_TOKEN
        this.LOG_PLATFORM = obj.LOG_PLATFORM
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

    daemon(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
        this.log(txtOrObj, txtOrObj2, txtOrObj3, 'DAEMON')
    }

    log(txtOrObj, txtOrObj2 = false, txtOrObj3 = false, LOG_SUBTYPE = 'ALL', LOG_AS_ERROR = false) {
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
                line += ' ' + txtOrObj2
            } else if (typeof txtOrObj2.sourceURL === 'undefined') {
                line += ' ' + JSON.stringify(txtOrObj2, null, '\t')
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
            // noinspection JSUnresolvedFunction
            firebase.crashlytics().log('==========ERROR ' + LOG_SUBTYPE + '==========')
        }
        // noinspection JSUnresolvedFunction
        firebase.crashlytics().log(line)


        if (txtOrObj3 && typeof txtOrObj3 !== 'undefined') {
            if (typeof txtOrObj3 === 'string') {
                line2 += '\n\t\t\t\t\t\t' + txtOrObj3
            } else {
                line2 += '\n\t\t\t\t\t\t' + JSON.stringify(txtOrObj3, null, '\t')
            }
            if (LOG_SUBTYPE !== 'DAEMON') {
                if (DEBUG || this.localConsole) {
                    console.log(line2)
                }
            } else if (DEBUG_DAEMON) {
                console.log(line2)
            }
            // noinspection JSUnresolvedFunction
            firebase.crashlytics().log(line2)
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
            LOGS_TXT['ALL'] = ' >> ' + line + line2 + '\n' + LOGS_TXT['ALL']
            FULL_LOGS_TXT['ALL'] = ' >> ' + line + line2 + '\n' + FULL_LOGS_TXT['ALL']
            if (LOGS_TXT['ALL'].length > MAX_MESSAGE) {
                LOGS_TXT['ALL'] = LOGS_TXT['ALL'].substr(0, MAX_MESSAGE) + '...'
            }
            if (FULL_LOGS_TXT['ALL'].length > FULL_MAX_MESSAGE) {
                FULL_LOGS_TXT['ALL'] = FULL_LOGS_TXT['ALL'].substr(0, FULL_MAX_MESSAGE) + '...'
            }
        }


        return true
    }

    async errDaemon(errorObjectOrText, errorObject2) {
        this.err(errorObjectOrText, errorObject2, 'DAEMON')
    }
    async errKsu(errorObjectOrText, errorObject2, USE_FORCE = false) {
        if (!USE_FORCE && this.LOG_TESTER === 'FALSE') return false
        return this.err(errorObjectOrText, errorObject2, 'ALL', true, '683743064:AAF9wbBImNu_DiCUhOtNNr6c9BARQMfYruM')
    }

    async err(errorObjectOrText, errorObject2, LOG_SUBTYPE = 'ALL', USE_FULL = false, USE_BOT = false) {
        let now = new Date()
        let date = now.toISOString().replace(/T/, ' ').replace(/\..+/, '')
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
                line += JSON.stringify(errorObjectOrText)
            }
        }

        if (config.debug.appErrors || DEBUG) {
            console.log(`----------------ERROR ${LOG_SUBTYPE}-----------------`)
            console.log(date + line)
            console.log(errorObjectOrText)
            if (errorObject2) {
                console.log(errorObject2)
            }
            return false
        }


        this.log(errorObjectOrText, errorObject2, false, LOG_SUBTYPE, true)

        if (errorObject2 && typeof errorObject2.code !== 'undefined' && (errorObject2.code === 'ERROR_USER' || errorObject2.code === 'ERROR_NOTICE')) {
            return true
        }

        let msg = `FRNT_jan_${this.LOG_VERSION} ${LOG_SUBTYPE}` + '\n' + date + line + '\n'
        if (typeof (this.LOG_TESTER) != 'undefined' && this.LOG_TESTER) {
            msg += '\nTESTER ' + this.LOG_TESTER
        }
        if (typeof (this.LOG_DEV) != 'undefined' && this.LOG_DEV) {
            msg += '\nDEV ' + this.LOG_DEV
        }
        if (typeof (this.LOG_WALLET) != 'undefined' && this.LOG_WALLET) {
            msg += '\nWALLET ' + this.LOG_WALLET
        }
        if (typeof (this.LOG_CASHBACK) != 'undefined' && this.LOG_CASHBACK) {
            msg += '\nCASHBACK ' + this.LOG_CASHBACK
        }
        if (typeof (this.LOG_TOKEN) != 'undefined' && this.LOG_TOKEN) {
            msg += '\nTOKEN ' + this.LOG_TOKEN.substr(0, 20)
        }
        if (typeof (this.LOG_PLATFORM) != 'undefined' && this.LOG_PLATFORM) {
            msg += '\nPLATFORM ' + this.LOG_PLATFORM
        }
        if (USE_FULL) {
            // noinspection ES6MissingAwait
            this.TG.send('\n\n\n\n=========================================================\n\n\n\n' + msg + '\n' + FULL_LOGS_TXT[LOG_SUBTYPE], USE_BOT ? USE_BOT : changeableProd.tg.info.fullBot)
        } else {

            try {
                if (typeof (this.LOG_VERSION) != 'undefined' && this.LOG_VERSION) {
                    // noinspection JSUnresolvedFunction
                    firebase.crashlytics().setStringValue('LOG_VERSION', this.LOG_VERSION)
                }
                if (typeof (this.LOG_TESTER) != 'undefined' && this.LOG_TESTER) {
                    // noinspection JSUnresolvedFunction
                    firebase.crashlytics().setStringValue('LOG_TESTER', this.LOG_TESTER)
                }
                if (typeof (this.LOG_DEV) != 'undefined' && this.LOG_DEV) {
                    // noinspection JSUnresolvedFunction
                    firebase.crashlytics().setStringValue('LOG_DEV', this.LOG_DEV)
                }
                if (typeof (this.LOG_WALLET) != 'undefined' && this.LOG_WALLET) {
                    // noinspection JSUnresolvedFunction
                    firebase.crashlytics().setStringValue('LOG_WALLET', this.LOG_WALLET)
                }
                if (typeof (this.LOG_CASHBACK) != 'undefined' && this.LOG_CASHBACK) {
                    // noinspection JSUnresolvedFunction
                    firebase.crashlytics().setStringValue('LOG_CASHBACK', this.LOG_CASHBACK)
                }
                if (typeof (this.LOG_TOKEN) != 'undefined' && this.LOG_TOKEN) {
                    // noinspection JSUnresolvedFunction
                    firebase.crashlytics().setStringValue('LOG_TOKEN', this.LOG_TOKEN)
                }
                if (typeof (this.LOG_PLATFORM) != 'undefined' && this.LOG_PLATFORM) {
                    // noinspection JSUnresolvedFunction
                    firebase.crashlytics().setStringValue('LOG_PLATFORM', this.LOG_PLATFORM)
                }
                // noinspection JSUnresolvedFunction
                if (typeof firebase.crashlytics().recordCustomError !== 'undefined') {
                    firebase.crashlytics().recordCustomError('FRNT', line, [])
                } else {
                    firebase.crashlytics().log('FRNT ' + line)
                    firebase.crashlytics().crash()
                }
            } catch (firebaseError) {
                msg += ' Crashlytics error ' + firebaseError.message
            }

            this.TG.send('\n\n\n\n=========================================================\n\n\n\n' + msg + '\n' + LOGS_TXT[LOG_SUBTYPE])
        }


        return true
    }

    getLogs() {
        return FULL_LOGS_TXT['ALL']
    }

    getHeaders() {
        let msg = `\n\n\n\n=================================\n\nVERSION_${this.LOG_VERSION}`
        if (typeof (this.LOG_TESTER) != 'undefined' && this.LOG_TESTER) {
            msg += '\nTESTER ' + this.LOG_TESTER
        }
        if (typeof (this.LOG_DEV) != 'undefined' && this.LOG_DEV) {
            msg += '\nDEV ' + this.LOG_DEV
        }
        if (typeof (this.LOG_WALLET) != 'undefined' && this.LOG_WALLET) {
            msg += '\n\nWALLET ' + this.LOG_WALLET
        }
        if (typeof (this.LOG_CASHBACK) != 'undefined' && this.LOG_CASHBACK) {
            msg += '\n\nCASHBACK ' + this.LOG_CASHBACK
        }
        if (typeof (this.LOG_TOKEN) != 'undefined' && this.LOG_TOKEN) {
            msg += '\n\nTOKEN ' + this.LOG_TOKEN.substr(0, 20)
            msg += '\n\nTOKEN FULL ' + this.LOG_TOKEN
        }
        if (typeof (this.LOG_PLATFORM) != 'undefined' && this.LOG_PLATFORM) {
            msg += '\n\nPLATFORM ' + this.LOG_PLATFORM
        }
        return msg
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

export default new Log()
