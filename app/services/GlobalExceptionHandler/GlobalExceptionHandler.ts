import {
    setJSExceptionHandler,
    getJSExceptionHandler
} from 'react-native-exception-handler'

import Log from '../Log/Log'

export default new class GlobalExceptionHandler {

    constructor() {
        this.init()
    }

    init = (): void => {
        setJSExceptionHandler(this.exceptionHandler, false)
        getJSExceptionHandler()
    }

    exceptionHandler = async (e: Error, isFatal: boolean): Promise<void> => {
        try {
            Log.err(this.errorTemplate(e))
        } catch (e) {
            console.log(e)
        }
    }

    errorTemplate = (e: Error): string => {
        return `
            
        ---------------- ERROR ----------------
        GlobalExceptionHandler.exceptionHandler
        ${JSON.stringify(e)}
        ${e.message}
        ---------------- ERROR ----------------
            
        `
    }

}