/**
 * @version 1.0
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import Log from '@app/services/Log/Log'
import { signTypedData } from '@metamask/eth-sig-util'

import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'

import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'
import {
    handleSendSignModal,
    handleSendSignTypedModal,
    handleSendTransactionRedirect,
    handleSessionProposalModal
} from '@app/appstores/Stores/WalletConnect/helpers'
import { Web3Injected } from '@crypto/services/Web3Injected'

import { Core } from '@walletconnect/core'
import { Web3Wallet } from '@walletconnect/web3wallet'
import { getSdkError } from '@walletconnect/utils'

import WalletConnectServiceWrapper from '@app/appstores/Stores/WalletConnect/WalletConnectServiceWrapper'
import WalletConnectServiceWrapperWeb3 from '@app/appstores/Stores/WalletConnect/WalletConnectServiceWrapperWeb3'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

let core = false
let web3wallet = false

const WC_PROJECT_ID = 'daa39ed4fa0978cc19a9c9c0a2a7015c' // https://cloud.walletconnect.com/app/project

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
                description: 'Trustee Wallet for Wallet Connect',
                url: 'https://trustee.deals',
                icons: ['https://walletconnect.org/walletconnect-logo.png'],
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
                Log.log('WalletConnectService.on v2 session_proposal error ' + e.message)
            }
        })

        web3wallet.on('session_request', (payload) => {
            try {
                console.log('WalletConnectService.on v2 session_request', JSON.stringify(payload))
                let { request, chainId } = payload.params
                const { method, params } = request
                if (method === 'personal_sign') {
                    handleSendSignModal(web3wallet, params[0], payload)
                } else if (method.indexOf('eth_') === -1) {
                    showModal({
                        type: 'INFO_MODAL',
                        icon: null,
                        title: strings('modal.exchange.sorry'),
                        description: `Method ${method} is not supported`
                    })
                } else {
                    if (chainId && chainId.indexOf(':') !== -1) {
                        const tmp = chainId.split(':')
                        if (typeof tmp[1] !== 'undefined') {
                            chainId = tmp[1] * 1
                        }
                    }
                    const WEB3 = Web3Injected(chainId)
                    if (method === 'eth_sendTransaction') {
                        handleSendTransactionRedirect(web3wallet, params[0], WEB3.MAIN_CURRENCY_CODE, payload)
                    } else if (method === 'eth_signTypedData') {
                        handleSendSignTypedModal(web3wallet, JSON.parse(params[1]), payload)
                    } else {
                        console.log(`
                    
                    
                    todo ` + method, params)
                    }
                }
            } catch (e) {
                Log.log('WalletConnectService.on v2 session_request error ' + e.message)
            }
        })

        web3wallet.on('session_delete', (payload) => {
            try {
                Log.log('WalletConnectService.on v2 session_delete', JSON.stringify(payload))
                walletConnectActions.resetWalletConnect()
            } catch (e) {
                Log.log('WalletConnectService.on v2 session_delete error ' + e.message)
            }
        })

        web3wallet.on('auth_request', async (payload) => {
            Log.log('WalletConnectService.on v2 auth_request', JSON.stringify(payload))
            console.log('auth_request', JSON.stringify(payload))
        })

        return web3wallet
    },

    createAndConnect: async (fullLink) => {
        if (web3wallet === false) {
            await walletConnectService._init()
        }
        const params = { uri: fullLink, activatePairing: true }
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
                throw new Error(e.message + ' in v2 web3wallet.core.pairing.pair')
            }
        }

        return web3wallet
    },

    approveRequest: async (walletConnector, walletConnectPayload, transactionHash) => {
        try {
            await walletConnector.approveRequest({
                id: walletConnectPayload.id,
                result: transactionHash
            })
        } catch (e) {
            Log.err('WalletConnectService.approveRequest error ' + e.message)
        }
    },

    approveSign: async (walletConnector, message, payload) => {
        try {
            Log.log('WalletConnectService.approveSign', message, payload)
            const { chainId } = payload
            const { account } = await walletConnectActions.getAndSetWalletConnectAccount(walletConnector, chainId)
            const discoverFor = {
                addressToCheck: account.address,
                derivationPath: account.derivationPath,
                walletHash: account.walletHash,
                currencyCode: account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'WalletConnectService')
            const WEB3 = Web3Injected(chainId)
            const signData = await WEB3.eth.accounts.sign(payload.params[0], privateData.privateKey)

            await walletConnector.approveRequest({
                id: payload.id,
                result: signData.signature
            })
        } catch (e) {
            Log.err('WalletConnectService.approveSign error ' + e.message)
        }
    },

    approveSignTyped: async (walletConnector, data, payload) => {
        try {
            Log.log('WalletConnectService.approveSignTyped2 ' + JSON.stringify(data), payload)
            const { chainId } = payload
            const { account } = await walletConnectActions.getAndSetWalletConnectAccount(walletConnector, chainId)
            const discoverFor = {
                addressToCheck: account.address,
                derivationPath: account.derivationPath,
                walletHash: account.walletHash,
                currencyCode: account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'WalletConnectService')
            const privateKey = Buffer.from(privateData.privateKey.slice(2), 'hex')
            const signData = signTypedData({ privateKey, data, version: 'V4' })
            await walletConnector.approveRequest({
                id: payload.id,
                result: signData
            })
        } catch (e) {
            Log.err('WalletConnectService.approveSignTyped2 error ' + e.message)
        }
    },

    rejectSession: async (walletConnector, payload) => {
        Log.log('WalletConnectService.rejectSession v2', payload)
        const { id } = payload
        if (id) {
            try {
                await walletConnector.rejectSession({
                    id,
                    reason: getSdkError('USER_REJECTED_METHODS')
                })
            } catch (e) {
                console.log('WalletConnectService.rejectSession v2 error ' + e.message)
                Log.err('WalletConnectService.rejectSession v2 error ' + e.message)
            }
        }
    },

    approveSession: async (walletConnector, payload) => {
        try {
            const { id, params } = payload
            const { requiredNamespaces, relays } = params

            Log.log('WalletConnectService.approveSession v2 payload.params.requiredNamespaces', requiredNamespaces)
            BlocksoftCryptoLog.log('WalletConnectService.approveSession v2 payload.params.requiredNamespaces', requiredNamespaces)

            const { namespaces } = await walletConnectActions.getAndSetWalletConnectAccount(payload)
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
            console.log('WalletConnectService.approveSession v2 error ' + e.message)
            Log.err('WalletConnectService.approveSession v2 error ' + e.message)
        }
    }
}

export default walletConnectService
