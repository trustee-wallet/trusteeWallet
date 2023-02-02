/**
 * @version 0.77
 */
import {
    setJSExceptionHandler,
    getJSExceptionHandler,
    setNativeExceptionHandler
} from 'react-native-exception-handler'

import Log from '@app/services/Log/Log'
import config from '@app/config/config'
import NavStore from '@app/components/navigation/NavStore'

let CACHE_LAST_ERROR = ''

const exceptionHandlerText = async (text: string, isFatal : string = 'native'): Promise<void> => {
    try {
        if (text === CACHE_LAST_ERROR) {
            // do nothing not to spam
        } else {
            CACHE_LAST_ERROR = text
            if (text.indexOf('the componentWillUnmount') === -1
                && text.indexOf('AsyncStorage has been extracted from react-native core') === -1
                && text.indexOf('Each child') === -1
                && text.indexOf('React state') === -1
            ) {
                Log.err('ERROR FROM HANDLER ' + isFatal + ' ' + text)
            } else {
                // do nothing
            }
        }
    } catch (e2) {
        console.log('-------error on Log.err-----')
        console.log(e2)
        console.log(text)
    }
}

const exceptionHandler = async (e: Error, isFatal: boolean): Promise<boolean> => {
    if (!e) {
        return false
    }

    const text = errorTemplate(e)
    await exceptionHandlerText(text, JSON.stringify(isFatal))

    if (!isFatal && e.message) {
        NavStore.reset('ErrorScreen', { error: e.message })
    }
    return true
}

const errorTemplate = (e: Error): string => {
    // eslint-disable-next-line no-undef
    if (config.debug.appErrors) {
        console.log('-----------GLOBAL ERROR---------')
        console.log(e)
        return ''
    }
    return `
            
        ---------------- GLOBAL ----------------
        ${JSON.stringify(e)}
        ${e.message || ''}
            
        `
}

setJSExceptionHandler(exceptionHandler, true)
getJSExceptionHandler()
setNativeExceptionHandler(exceptionHandlerText, true, false)
