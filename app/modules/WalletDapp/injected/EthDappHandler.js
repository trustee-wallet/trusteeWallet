import config from '@app/config/config'
import Log from '@app/services/Log/Log'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'

const EthDappHandler = {
    account: {},
    web3: {},
    web3EventSend: {},
    init: (_account, _web3) => {
        EthDappHandler.account = _account
        EthDappHandler.web3 = _web3
    },

    byMethod: async (method, data, asked) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts' || method === 'accountsChanged') {
            const onEvent = typeof EthDappHandler.web3EventSend['accountsChanged'] === 'undefined' ? 'accountsChanged' : false
            EthDappHandler.web3EventSend['accountsChanged'] = true
            return { result: [EthDappHandler.account.address], onEvent }
        } else if (method === 'eth_chainId' || method === 'chainChanged') {
            const onEvent = typeof EthDappHandler.web3EventSend['chainChanged'] === 'undefined' ? 'chainChanged' : false
            EthDappHandler.web3EventSend['chainChanged'] = true
            return { result: BlocksoftUtils.decimalToHexWalletConnect(EthDappHandler.web3.MAIN_CHAIN_ID), onEvent }
        } else if (method === 'net_version') {
            const onEvent = typeof EthDappHandler.web3EventSend['chainChanged'] === 'undefined' ? 'chainChanged' : false
            EthDappHandler.web3EventSend['chainChanged'] = true
            return { result: EthDappHandler.web3.MAIN_CHAIN_ID, onEvent }
        } else if (method === 'eth_signTransaction') {
            // https://eth.wiki/json-rpc/API#eth_sign
            if (!asked) {
                return {
                    shouldAsk: true,
                    shouldAskText : 'do you want to sign ' + JSON.stringify(data.params[0]).substr(0, 20) + '... ',
                    res: false
                }
            }
            const discoverFor = {
                addressToCheck: EthDappHandler.account.address,
                derivationPath: EthDappHandler.account.derivationPath,
                walletHash: EthDappHandler.account.walletHash,
                currencyCode: EthDappHandler.account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'EthDappHandler')
            const result = await EthDappHandler.web3.eth.accounts.signTransaction(data.params[0], privateData.privateKey)
            return {result : result.signature}
        } else if (method === 'personal_sign') {
            if (!asked) {
                return {
                    shouldAsk: true,
                    shouldAskText : 'do you want to sign ' + data.params[0].substr(0, 20) + '... ',
                    res: false
                }
            }
            const discoverFor = {
                addressToCheck: EthDappHandler.account.address,
                derivationPath: EthDappHandler.account.derivationPath,
                walletHash: EthDappHandler.account.walletHash,
                currencyCode: EthDappHandler.account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'EthDappHandler')
            const result = await EthDappHandler.web3.eth.accounts.sign(data.params[0], privateData.privateKey)
            return {result : result.signature}
        } else if (method) {
            const tmpRes = await BlocksoftAxios._request(EthDappHandler.web3.LINK, 'POST', data)
            if (typeof tmpRes.data.result === 'undefined' || !tmpRes.data.result) {
                if (config.debug.appErrors) {
                    console.log('EthDappHandler no result for handler ' + method, data)
                }
                Log.log('EthDappHandler no result for handler ' + method, data)
            } else {
                return { result: tmpRes.data.result }
            }
        } else {
            if (config.debug.appErrors) {
                console.log('EthDappHandler no callData.method handler', method)
            }
            Log.log('EthDappHandler no callData.method handler', method)
        }
    },

    handle: async (callData, asked = false) => {
        if (callData.action === 'onEvent') {
            const res = await EthDappHandler.byMethod(callData.event, callData.data, asked)
            return { res }
        } else if (callData.action === 'getAccounts') {
            const res = EthDappHandler.byMethod('eth_accounts')
            return { res }
        } else if (callData.action === 'sendAsync' || callData.action === 'send') {
            if (typeof callData.data.method !== 'undefined') {
                const { result, onEvent, shouldAsk, shouldAskText } = await EthDappHandler.byMethod(callData.data.method, callData.data, asked)
                if (typeof shouldAsk !== 'undefined' && shouldAsk) {
                    return {
                        shouldAsk,
                        shouldAskText,
                        res : false
                    }
                }
                return { res: { rpc: { id: callData.data.id, jsonrpc: '2.0', result }, onEvent } }
            } else {
                throw new Error('no method')
            }
        } else if (callData.action === 'request') {
            if (typeof callData.data.method !== 'undefined') {
                const res = await EthDappHandler.byMethod(callData.data.method, callData.data, asked)
                return { res }
            } else {
                throw new Error('no method')
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
