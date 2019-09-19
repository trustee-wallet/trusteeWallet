/**
 * Separated log class for crypto module - could be encoded here later
 */
import BlocksoftTg from './BlocksoftTg'
import BlocksoftKeysStorage from '../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import firebase from 'react-native-firebase'

const VER = 'v5'

const IN_TEST = (process && process.env && process.env['JEST_WORKER_ID'])
const SHOW_IN_TEST = false
const DEBUG = false

let LOGS_TXT = ''

class BlocksoftCryptoLog {
    logDivider() {
        let line = '\n\n\n-----------------------------------------------------------------------\n\n\n'
        if (DEBUG) {
            console.log(line)
        }
        // noinspection JSUnresolvedFunction
        firebase.crashlytics().log(line)
        LOGS_TXT = line + LOGS_TXT
    }

    log(txtOrObj, txtOrObj2 = false, txtOrObj3 = false) {
        if (IN_TEST && !SHOW_IN_TEST) {
            return true
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
                line += ' ' + txtOrObj2
            } else if (typeof txtOrObj2.sourceURL === 'undefined') {
                line += ' ' + JSON.stringify(txtOrObj2, null, '\t')
            }
        }

        // noinspection JSUnresolvedFunction
        firebase.crashlytics().log(line)

        if (txtOrObj3 && typeof txtOrObj3 !== 'undefined') {
            if (typeof txtOrObj3 === 'string') {
                line2 += '\n\t\t\t\t\t\t' + txtOrObj3
            } else {
                line2 += '\n\t\t\t\t\t\t' + JSON.stringify(txtOrObj3, null, '\t')
            }
            // noinspection JSUnresolvedFunction
            firebase.crashlytics().log(line2)
        }

        LOGS_TXT = line + line2 + '\n' + LOGS_TXT
        if (LOGS_TXT.length > 500000) {
            LOGS_TXT = LOGS_TXT.substr(0, 100000) + '...'
        }

        //if (IN_TEST || DEBUG) {
            console.log(line)
            console.log(line2)
            return true
        //}

        return true
    }

    async err(errorObjectOrText, errorObject2, errorTitle = 'ERROR') {
        if (IN_TEST) {
            console.error(errorObjectOrText)
            if (errorObject2 && typeof errorObject2 !== 'undefined') {
                console.error(errorObject2)
            }
            return true
        }
        const LOG_WALLET = await BlocksoftKeysStorage.getSelectedWallet()

        let now = new Date()
        let line = now.toISOString().replace(/T/, ' ').replace(/\..+/, '')

        if (errorObjectOrText && typeof errorObjectOrText !== 'undefined') {
            if (typeof errorObjectOrText === 'string') {
                line += ' ' + errorObjectOrText
            } else if (typeof errorObjectOrText.code !== 'undefined') {
                line += ' ' + errorObjectOrText.code + ' ' + errorObjectOrText.message
            } else {
                line += ' ' + errorObjectOrText.message
            }
        }

        if (errorObject2 && typeof errorObject2 !== 'undefined' && typeof errorObject2.message !== 'undefined') {
            line += ' ' + errorObject2.message
        }

        this.log(errorObjectOrText, errorObject2)

        if (DEBUG) {
            console.log('\n\n\n\n==================' + errorTitle + '====================\n\n\n\n')
        }
        LOGS_TXT = '\n\n\n\n==========' + errorTitle + '==========\n\n\n\n' + LOGS_TXT
        // noinspection JSUnresolvedFunction
        firebase.crashlytics().log('==========' + errorTitle + '==========')


        if (errorObject2 && typeof errorObject2.code !== 'undefined' && errorObject2.code === 'ERROR_USER') {
            return true
        }

        let msg = `CRYPT_${VER} ${LOG_WALLET} + ${line}`
        try {
            if (typeof (LOG_WALLET) != 'undefined' && LOG_WALLET) {
                // noinspection JSUnresolvedFunction
                firebase.crashlytics().setStringValue('LOG_WALLET', LOG_WALLET)
            }
            // noinspection JSUnresolvedFunction
            firebase.crashlytics().recordCustomError('CRYPT', line, [])
        } catch (firebaseError) {
            msg += ' Crashlytics error ' + firebaseError.message
        }
        // noinspection ES6MissingAwait
        BlocksoftTg.send('\n\n\n\n=========================================================\n\n\n\n' + msg + '\n' + LOGS_TXT)


        return true
    }

    getLogs() {
        return LOGS_TXT
    }
}

export default new BlocksoftCryptoLog()
