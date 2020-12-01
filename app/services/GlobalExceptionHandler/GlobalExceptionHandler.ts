import {
    setJSExceptionHandler,
    getJSExceptionHandler,
    setNativeExceptionHandler
} from 'react-native-exception-handler'

import Log from '../Log/Log'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { strings } from '../i18n'
import config from '../../config/config'

let CACHE_LAST_ERROR = ''

export default new class GlobalExceptionHandler {

    constructor() {
        this.init()
    }

    init = (): void => {
        setJSExceptionHandler(this.exceptionHandler, true)
        getJSExceptionHandler()
        setNativeExceptionHandler(this.exceptionHandlerText, true, false)
    }

    exceptionHandlerText = async (text : string) : Promise<void> => {
        try {
            if (text === CACHE_LAST_ERROR) {
                // do nothing not to spam
            } else {
                CACHE_LAST_ERROR = text
                if (text.indexOf('the componentWillUnmount') === -1) {
                    Log.err(text)
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

    exceptionHandler = async (e: Error, isFatal: boolean): Promise<boolean> => {
        if (!e) {
            return false
        }

        const text = this.errorTemplate(e)
        await this.exceptionHandlerText(text)

        return true
    }

    errorTemplate = (e: Error): string => {
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

}
