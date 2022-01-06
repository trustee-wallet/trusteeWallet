import config from '@app/config/config'
import Log from '@app/services/Log/Log'

const EthDappHandler = {
    account : {},

    init : (_account) => {
        EthDappHandler.account = _account
    },

    byMethod : async (method, data) => {
        if (method === 'eth_accounts') {
            return [ EthDappHandler.account.address ]
        } else {
            if (config.debug.appErrors) {
                console.log('EthDappHandler no callData.method handler', method)
            }
            Log.log('EthDappHandler no callData.method handler', method)
        }
    },

    handle : async (callData, asked = false) => {
        if (callData.action === 'onEvent') {
            return {res : 'ok'}
        } else if (callData.action === 'sendAsync') {
            if (typeof callData.data.method !== 'undefined') {
                const result = await EthDappHandler.byMethod(callData.data.method, callData.data)
                return {res : { id: callData.data.id, jsonrpc: '2.0', result}}
            } else {
                throw new Error ('no method')
            }
        } else {
            if (config.debug.appErrors) {
                console.log('EthDappHandler no callData.action handler', callData)
            }
            Log.log('EthDappHandler no callData.action handler', callData)
        }
    }
}

export default EthDappHandler
