import firebase from 'react-native-firebase'

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'

import BlocksoftKeysStorage from '../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftTg from '../../../crypto/common/BlocksoftTg'

const VER = 'v5'
const DEBUG = false // set true to see usual logs in console
const DEBUG_DAEMON = false // set true to see cron jobs logs in console

let LOGS_TXT = {
    DAEMON: '',
    ALL: ''
}

class Log {
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
            // if (DEBUG || this.localConsole) {
                if (LOG_AS_ERROR) {
                    console.log('\n\n\n\n==================ERROR ' + LOG_SUBTYPE + '====================\n\n\n\n' + line)
                } else {
                    console.log(line)
                }
            //}
        } else if (DEBUG_DAEMON) {
            if (LOG_AS_ERROR) {
                console.log('\n\n\n\n==================ERROR ' + LOG_SUBTYPE + '====================\n\n\n\n' + line)
            } else {
                console.log(line)
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
                //if (DEBUG || this.localConsole) {
                    console.log(line2)
                //}
            } else if (true || DEBUG_DAEMON) {
                console.log(line2)
            }
            // noinspection JSUnresolvedFunction
            firebase.crashlytics().log(line2)
        }

        if (LOG_AS_ERROR) {
            line = '\n\n\n\n==========ERROR ' + LOG_SUBTYPE + '==========\n\n\n\n' + line
        }
        LOGS_TXT[LOG_SUBTYPE] = line + line2 + '\n' + LOGS_TXT[LOG_SUBTYPE]
        if (LOGS_TXT[LOG_SUBTYPE].length > 500000) {
            LOGS_TXT[LOG_SUBTYPE] = LOGS_TXT[LOG_SUBTYPE].substr(0, 100000) + '...'
        }

        if (LOG_SUBTYPE !== 'ALL') { // for DAEMON AND OTHER TYPES
            LOGS_TXT['ALL'] = ' >> ' + line + line2 + '\n' + LOGS_TXT['ALL']
            if (LOGS_TXT['ALL'].length > 500000) {
                LOGS_TXT['ALL'] = LOGS_TXT['ALL'].substr(0, 100000) + '...'
            }
        }


        return true
    }

    async errDaemon(errorObjectOrText, errorObject2) {
        this.err(errorObjectOrText, errorObject2, 'DAEMON')
    }

    async err(errorObjectOrText, errorObject2, LOG_SUBTYPE = 'ALL') {
        const LOG_WALLET = await BlocksoftKeysStorage.getSelectedWallet()
        const LOG_TOKEN = await AsyncStorage.getItem('fcmToken')
        const LOG_PLATFORM = Platform.OS + ' v' + Platform.Version


        let now = new Date()
        let line = now.toISOString().replace(/T/, ' ').replace(/\..+/, '')


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

        if (errorObject2 && typeof errorObject2 !== 'undefined' && typeof errorObject2.message !== 'undefined') {
            line += ' err ' + errorObject2.message
        }

        this.log(errorObjectOrText, errorObject2, false, LOG_SUBTYPE, true)

        if (errorObject2 && typeof errorObject2.code !== 'undefined' && (errorObject2.code === 'ERROR_USER' || errorObject2.code === 'ERROR_NOTICE')) {
            return true
        }

        let msg = `FRONT_${VER} ${LOG_SUBTYPE} ${LOG_WALLET}` + '\n' + line + '\n'
        if (typeof(LOG_TOKEN) != 'undefined' && LOG_TOKEN) {
            msg += '\nTOKEN ' + LOG_TOKEN.substr(0, 20)
        }
        if (typeof(LOG_PLATFORM) != 'undefined' && LOG_PLATFORM) {
            msg += '\nPLATFORM ' + LOG_PLATFORM
        }
        try {
            if (typeof(LOG_WALLET) != 'undefined' && LOG_WALLET) {
                // noinspection JSUnresolvedFunction
                firebase.crashlytics().setStringValue('LOG_WALLET', LOG_WALLET)
            }
            if (typeof(LOG_TOKEN) != 'undefined' && LOG_TOKEN) {
                // noinspection JSUnresolvedFunction
                firebase.crashlytics().setStringValue('LOG_TOKEN', LOG_TOKEN)
            }
            if (typeof(LOG_PLATFORM) != 'undefined' && LOG_PLATFORM) {
                // noinspection JSUnresolvedFunction
                firebase.crashlytics().setStringValue('LOG_PLATFORM', LOG_PLATFORM)
            }
            // noinspection JSUnresolvedFunction
            firebase.crashlytics().recordCustomError('FRONT', line, [])
        } catch (firebaseError) {
            msg += ' Crashlytics error ' + firebaseError.message
        }
        // noinspection ES6MissingAwait
        BlocksoftTg.send('\n\n\n\n=========================================================\n\n\n\n' + msg + '\n' + LOGS_TXT[LOG_SUBTYPE])


        return true
    }

}

export default new Log()
