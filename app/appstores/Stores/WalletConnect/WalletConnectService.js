/**
 * @version 2.0
 */
import Log from '@app/services/Log/Log'
import { signTypedData } from '@metamask/eth-sig-util'

import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'

import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'
import {
    handleSendSignModal,
    handleSendSignTypedModal,
    handleSendTransactionRedirect,
    handleSessionProposalModal, handleSignTransactionModal
} from '@app/appstores/Stores/WalletConnect/helpers'
import { Web3Injected } from '@crypto/services/Web3Injected'

import { Core } from '@walletconnect/core'
import { Web3Wallet } from '@walletconnect/web3wallet'
import { getSdkError } from '@walletconnect/utils'

import WalletConnectServiceWrapper from '@app/appstores/Stores/WalletConnect/WalletConnectServiceWrapper'
import WalletConnectServiceWrapperWeb3 from '@app/appstores/Stores/WalletConnect/WalletConnectServiceWrapperWeb3'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import config from '@app/config/config'
import store from '@app/store'

let core = false
let web3wallet = false

const WC_PROJECT_ID = 'daa39ed4fa0978cc19a9c9c0a2a7015c' // https://cloud.walletconnect.com/app/project

const _getPrivateData = async (from) => {
    const accountList = store.getState().accountStore.accountList
    if (!accountList) {
        return false
    }
    let account = false
    for (const walletHash in accountList) {
        for (const currencyCode in accountList[walletHash]) {
            if (typeof accountList[walletHash][currencyCode].address !== 'undefined'
                && accountList[walletHash][currencyCode].address.toLowerCase() === from.toLowerCase()) {
                account = accountList[walletHash][currencyCode]
            }
        }
    }
    if (!account) {
        return false
    }

    const discoverFor = {
        addressToCheck: account.address,
        derivationPath: account.derivationPath,
        walletHash: account.walletHash,
        currencyCode: account.currencyCode
    }
    const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'WalletConnectService')
    return privateData
}
const _getAccounts = (payload) => {
    const { walletHash } = store.getState().mainStore.selectedWallet
    const { params } = payload
    const { requiredNamespaces } = params

    const accountList = store.getState().accountStore.accountList
    if (!accountList || typeof accountList[walletHash] === 'undefined') {
        return false
    }
    const currentETHAddress = accountList[walletHash]['ETH']
    const namespaces = {}
    for (const key in requiredNamespaces) {
        const accounts = []
        for (const chain of requiredNamespaces[key].chains) {
            if (chain === 'tron:0x2b6653dc' && typeof accountList[walletHash]['TRX'] !== 'undefined') {
                accounts.push(`${chain}:${accountList[walletHash]['TRX'].address}`)
            } else if (chain === 'tron:0x2b6653dc' && typeof accountList[walletHash]['TRX_USDT'] !== 'undefined') {
                accounts.push(`${chain}:${accountList[walletHash]['TRX_USDT'].address}`)
            } else if (chain === 'solana' && typeof accountList[walletHash]['SOL'] !== 'undefined') {
                accounts.push(`${chain}:${accountList[walletHash]['SOL'].address}`)
            } else if (chain === 'solana' && typeof accountList[walletHash]['SOL_USDT'] !== 'undefined') {
                accounts.push(`${chain}:${accountList[walletHash]['SOL_USDT'].address}`)
            } else {
                accounts.push(`${chain}:${currentETHAddress.address}`)
            }
        }
        namespaces[key] = {
            accounts,
            methods: requiredNamespaces[key].methods,
            events: requiredNamespaces[key].events
        }
    }
    return {
        namespaces
    }
}

const walletConnectService = {

    _init: async () => {
        core = new Core({
            // logger: 'debug',
            projectId: WC_PROJECT_ID,
            relayUrl: 'wss://relay.walletconnect.com'
        })
        core = WalletConnectServiceWrapper(core)

        web3wallet = await Web3Wallet.init({
            core,
            metadata: {
                description: 'Trustee Wallet',
                url: 'https://trustee.deals',
                icons: ['https://trusteeglobal.com/wp-content/uploads/2023/03/icon_wallet.png'],
                name: 'Trustee Wallet'
            }
        })

        web3wallet = await WalletConnectServiceWrapperWeb3(web3wallet)

        web3wallet.on('session_proposal', async (payload) => {
            try {
                if (!payload) {
                    Log.log('WalletConnectService.on v2 session_proposal no payload')
                    return
                }
                Log.log('WalletConnectService.on v2 session_proposal', JSON.stringify(payload))
                handleSessionProposalModal(web3wallet, payload)
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('WalletConnectService.on v2 session_proposal error ' + e.message)
                }
                Log.log('WalletConnectService.on v2 session_proposal error ' + e.message)
            }
        })

        web3wallet.on('session_request', (payload) => {
            try {
                Log.log('WalletConnectService.on v2 session_request', JSON.stringify(payload))
                let { request, chainId } = payload.params
                const { method, params } = request

                if (typeof chainId !== 'undefined' && chainId && chainId.indexOf(':') !== -1) {
                    const tmp = chainId.split(':')
                    if (typeof tmp[1] !== 'undefined') {
                        chainId = tmp[1] * 1
                    }
                }

                if (method === 'personal_sign') {
                    handleSendSignModal(web3wallet, chainId, params[1], params[0], payload)
                } else if (method.indexOf('eth_') === -1) {
                    if (config.debug.appErrors) {
                        console.log('WalletConnectService.on v2 session_request todo method ' + method, JSON.stringify(payload))
                    }
                    Log.log('WalletConnectService.on v2 session_request todo method ' + method, JSON.stringify(payload))
                    showModal({
                        type: 'INFO_MODAL',
                        icon: null,
                        title: strings('modal.exchange.sorry'),
                        description: `Method ${method} is not supported`
                    })
                    walletConnectService.rejectRequest(web3wallet, payload)
                } else {
                    const WEB3 = Web3Injected(chainId)
                    if (method === 'eth_sendTransaction') {
                        handleSendTransactionRedirect(web3wallet, params[0], WEB3.MAIN_CURRENCY_CODE, payload)
                    } else if (method === 'eth_signTransaction') {
                        handleSignTransactionModal(web3wallet, chainId, params[0], WEB3.MAIN_CURRENCY_CODE, payload)
                    } else if (method === 'eth_sign') {
                        handleSendSignModal(web3wallet, chainId, params[0], params[1], payload)
                    } else if (method === 'eth_signTypedData') {
                        handleSendSignTypedModal(web3wallet, chainId, params[0], JSON.parse(params[1]), payload)
                    } else {
                        if (config.debug.appErrors) {
                            console.log('WalletConnectService.on v2 session_request no method ' + method, JSON.stringify(payload))
                        }
                        Log.log('WalletConnectService.on v2 session_request no method ' + method, JSON.stringify(payload))
                    }
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('WalletConnectService.on v2 session_request error ' + e.message)
                }
                Log.log('WalletConnectService.on v2 session_request error ' + e.message)
            }
        })

        web3wallet.on('session_delete', (payload) => {
            try {
                Log.log('WalletConnectService.on v2 session_delete', JSON.stringify(payload))
                walletConnectActions.resetWalletConnect()
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('WalletConnectService.on v2 session_delete error ' + e.message)
                }
                Log.log('WalletConnectService.on v2 session_delete error ' + e.message)
            }
        })

        web3wallet.on('auth_request', async (payload) => {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.on v2 auth_request', JSON.stringify(payload))
            }
            Log.log('WalletConnectService.on v2 auth_request', JSON.stringify(payload))
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: `Method auth_request is not supported`
            })
        })

        return web3wallet
    },

    createAndConnect: async (fullLink, activatePairing) => {
        try {
            if (web3wallet === false) {
                await walletConnectService._init()
            }
            Log.log('WalletConnectService.on v2 init fullLink ' + fullLink + ' ' + (activatePairing ? 'activePairing' : 'no pairing'))
            const params = activatePairing ? { uri: fullLink, activatePairing } : { uri: fullLink }
            try {
                await web3wallet.core.pairing.pair(params)
            } catch (e) {
                if (e.message.indexOf('Pairing already exists') !== -1 || e.message.indexOf('Keychain already exists') !== -1) {
                    // do nothing
                    Log.log('WalletConnectService.on v2 web3wallet.core.pairing.pair error 1 ' + e.message)
                } else if (e.message.indexOf('Request validation') !== -1) {
                    // do nothing
                    Log.log('WalletConnectService.on v2 web3wallet.core.pairing.pair error 2 ' + e.message)
                } else {
                    if (config.debug.appErrors) {
                        console.log('WalletConnectService.on ' + e.message + ' in v2 web3wallet.core.pairing.pair')
                    }
                    throw new Error(e.message + ' in v2 web3wallet.core.pairing.pair')
                }
            }

            return web3wallet
        } catch (e1) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService createAndConnect v2 error ' + e1.message)
            }
            throw new Error(e1)
        }
    },

    getConnections: async (walletConnector) => {
        const connections = []
        try {
            const activeSessions = await walletConnector.getActiveSessions()
            for (const key in activeSessions) {
                const res = {
                    key,
                    topic : activeSessions[key].topic,
                    peer: activeSessions[key].peer.metadata
                }
                connections.push(res)
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.getConnections v2 error ' + e.message)
            }
            Log.log('WalletConnectService.getConnections v2 error ' + e.message)
        }
        return connections
    },

   killConnections: async (walletConnector) => {
        const connections = []
        try {
            const activeSessions = await walletConnector.getActiveSessions()
            for (const key in activeSessions) {
                const res = {
                    key,
                    topic : activeSessions[key].topic,
                    peer: activeSessions[key].peer.metadata
                }
                try {
                    await walletConnector.disconnectSession({
                        topic: activeSessions[key].topic,
                        reason: getSdkError("USER_DISCONNECTED"),
                    })
                } catch (e) {
                    if (config.debug.appErrors) {
                        console.log('WalletConnectService.killConnections v2 error 2 ' + e.message, res)
                    }
                    Log.log('WalletConnectService.killConnections v2 error 2 ' + e.message, res)
                    connections.push(res)
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.killConnections v2 error ' + e.message)
            }
            Log.log('WalletConnectService.killConnections v2 error ' + e.message)
        }
        return connections
    },

    approveRequest: async (walletConnector, payload, transactionHash) => {
        try {
            Log.log('WalletConnectService.approveRequest v2 transactionHash ' + JSON.stringify(transactionHash), payload)
            const res = {
                topic: payload.topic,
                response: {
                    id: payload.id,
                    jsonrpc: '2.0',
                    result: transactionHash
                }
            }
            if (walletConnector) {
                await walletConnector.respondSessionRequest(res)
            } else {
                await web3wallet.respondSessionRequest(res)
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.approveRequest v2 error ' + e.message)
            }
            Log.log('WalletConnectService.approveRequest v2 error ' + e.message)
        }
    },

    // https://docs.walletconnect.com/2.0/advanced/rpc-reference/ethereum-rpc#eth_signtransaction
    approveSignTransaction: async (walletConnector, chainId, from, transaction, accountCurrencyCode, payload) => {
        try {
            Log.log('WalletConnectService.approveSignTransaction v2 chainId ' + chainId + ' from ' + from + ' transaction ' + JSON.stringify(transaction), payload)

            const privateData = await _getPrivateData(from)
            if (!privateData) {
                return false
            }
            const WEB3 = Web3Injected(chainId)
            const signData = await WEB3.eth.accounts.signTransaction(transaction, privateData.privateKey)
            Log.log('WalletConnectService.approveSignTransaction v2 chainId ' + chainId + ' from ' + from + ' signData', signData)
            const res = {
                topic: payload.topic,
                response: {
                    id: payload.id,
                    jsonrpc: '2.0',
                    result: signData.rawTransaction
                }
            }
            await walletConnector.respondSessionRequest(res)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.approveSignTransaction v2 error ' + e.message)
            }
            Log.log('WalletConnectService.approveSignTransaction v2 error ' + e.message)
        }
    },

    approveSign: async (walletConnector, chainId, from, message, payload) => {
        try {
            Log.log('WalletConnectService.approveSign v2 chainId ' + chainId + ' from ' + from + ' message ' + message, payload)

            const privateData = await _getPrivateData(from)
            if (!privateData) {
                return false
            }
            const WEB3 = Web3Injected(chainId)
            const signData = await WEB3.eth.accounts.sign(message, privateData.privateKey)

            const res = {
                topic: payload.topic,
                response: {
                    id: payload.id,
                    jsonrpc: '2.0',
                    result: signData.signature
                }
            }
            await walletConnector.respondSessionRequest(res)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.approveSign v2 error ' + e.message)
            }
            Log.log('WalletConnectService.approveSign v2 error ' + e.message)
        }
    },

    approveSignTyped: async (walletConnector, chainId, from, data, payload) => {
        try {
            Log.log('WalletConnectService.approveSignTyped2 v2 chainId' + chainId + ' from ' + from + ' data ' + JSON.stringify(data), payload)

            const privateData = await _getPrivateData(from)
            if (!privateData) {
                return false
            }
            const privateKey = Buffer.from(privateData.privateKey.slice(2), 'hex')
            if (!privateKey) {
                return false
            }
            const signData = signTypedData({ privateKey, data, version: 'V4' })
            const res = {
                topic: payload.topic,
                response: {
                    id: payload.id,
                    jsonrpc: '2.0',
                    result: signData
                }
            }
            await walletConnector.respondSessionRequest(res)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.approveSignTyped2 v2 error ' + e.message)
            }
            Log.log.log('WalletConnectService.approveSignTyped2 v2 error ' + e.message)
        }
    },

    rejectRequest: async (walletConnector, payload) => {
        try {
            Log.log('WalletConnectService.rejectSession v2', payload)
            const { id } = payload
            if (id) {
                const res = {
                    topic: payload.topic,
                    response: {
                        id: payload.id,
                        jsonrpc: '2.0',
                        error: getSdkError('USER_REJECTED_METHODS').message
                    }
                }
                if (walletConnector) {
                    await walletConnector.respondSessionRequest(res)
                } else {
                    await web3wallet.respondSessionRequest(res)
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.rejectRequest v211 error ' + e.message)
            }
            Log.log('WalletConnectService.rejectRequest v2 error ' + e.message)
        }
    },

    rejectSession: async (walletConnector, payload) => {
        try {
            Log.log('WalletConnectService.rejectSession v2', payload)
            const { id } = payload
            if (id) {
                await walletConnector.rejectSession({
                    id,
                    reason: getSdkError('USER_REJECTED_METHODS')
                })
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.rejectSession v2 error ' + e.message)
            }
            Log.log('WalletConnectService.rejectSession v2 error ' + e.message)
        }
    },

    approveSession: async (walletConnector, payload) => {
        try {
            const { id, params } = payload
            const { requiredNamespaces, relays } = params
            Log.log('WalletConnectService.approveSession v2 payload.params.requiredNamespaces', requiredNamespaces)
            const { namespaces } = _getAccounts(payload)
            try {
                Log.log('WalletConnectService.approveSession v2 namespaces ' + JSON.stringify(namespaces))
                await walletConnector.approveSession({
                    id,
                    relayProtocol: relays[0].protocol,
                    namespaces
                })
            } catch (e1) {
                if (e1.message.indexOf('Session currently connected') === -1) {
                    throw e1
                }
            }
            return namespaces
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnectService.approveSession v2 error ' + e.message)
            }
            Log.log('WalletConnectService.approveSession v2 error ' + e.message)
        }
    }
}

export default walletConnectService
