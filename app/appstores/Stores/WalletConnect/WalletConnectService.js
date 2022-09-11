/**
 * @version 1.0
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import Log from '@app/services/Log/Log'
import { signTypedData } from '@metamask/eth-sig-util'

import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'

import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'
import { handleSendSignModal, handleSendSignTypedModal, handleSendTransactionRedirect, handleSessionRequestModal } from '@app/appstores/Stores/WalletConnect/helpers'
import { Web3Injected } from '@crypto/services/Web3Injected'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'


const walletConnectCore = require('@walletconnect/core')
const walletConnectISO = require('@walletconnect/iso-crypto')

class WalletConnect extends walletConnectCore.default {
    // @ts-ignore
    constructor(connectorOpts, pushServerOpts) {
        super({
            cryptoLib: walletConnectISO,
            connectorOpts,
            pushServerOpts
        })
    }
}

const walletConnectService = {

    createAndConnect: (fullLink, session, dappData) => {
        const walletConnector = new WalletConnect(
            {
                uri: fullLink,
                clientMeta: {
                    description: 'Trustee Wallet for Wallet Connect',
                    url: 'https://trustee.deals',
                    icons: ['https://walletconnect.org/walletconnect-logo.png'],
                    name: 'Trustee Wallet'
                },
                session
            }
        )
        walletConnector.on('session_request', (error, payload) => {
            Log.log('WalletConnectService.on session_request payload', payload, error)
            if (error) {
                throw error
            }
            if (!walletConnector.connected) {
                walletConnector.createSession()
            }

            if (!payload) {
                Log.log('WalletConnectService.on session_request no payload')
                return
            }
            if (typeof payload.method === 'undefined' || payload.method !== 'session_request') {
                Log.log('WalletConnectService.on session_request no payload method')
                return
            }
            if (typeof payload.params === 'undefined' || typeof payload.params[0] === 'undefined') {
                Log.log('WalletConnectService.on session_request no payload params')
                return
            }
            Log.log('WalletConnectService.on session_request finish', payload.params[0])

            handleSessionRequestModal(walletConnector, payload.params[0], dappData)
        })

        walletConnector.on('session_update', (error, payload) => {
            Log.log('WalletConnectService.on session_update payload', payload)
            if (error) {
                throw error
            }
            walletConnectActions.setIsConnectedWalletConnect({
                isConnected: walletConnector.session.connected,
                peerId: walletConnector.peerId,
                peerMeta: walletConnector.peerMeta
            })
        })

        walletConnector.on('call_request', (error, payload) => {
            try {
                Log.log('WalletConnectService.on call_request payload', payload)
                if (error) {
                    throw new Error('Strange ' + error.message)
                }
                if (payload.method === 'wallet_addEthereumChain' || payload.method === 'wallet_switchEthereumChain') {
                    const chainId = 1 * BlocksoftUtils.hexToDecimalWalletConnect(payload.params[0].chainId)
                    Log.log('autoChangeChain ' + payload.params[0].chainId + ' => ' + chainId)
                    walletConnectActions.getAndSetWalletConnectAccountNetwork(walletConnector, chainId)
                } else if (payload.method === 'eth_signTypedData') {
                    handleSendSignTypedModal(walletConnector, JSON.parse(payload.params[1]), payload)
                } else if (payload.method === 'personal_sign') {
                    const message = payload.params[0]
                    handleSendSignModal(walletConnector, message, payload)
                } else if (payload.method === 'eth_sendTransaction') {
                    handleSendTransactionRedirect(walletConnector, payload.params[0], payload)
                } else {
                    Log.err('WalletConnectService.on call_request unknown method: ' + payload.method)
                    throw new Error('Please call developers to add support of method: ' + payload.method)
                }
            } catch (e) {
                Log.err('WalletConnectService.on call_request error ' + e.message)
            }
        })

        walletConnector.on('disconnect', (error, payload) => {
            Log.log('WalletConnectService.on disconnect payload', payload)
            if (error) {
                throw error
            }
            if (payload.event === 'disconnect') {
                walletConnectActions.resetWalletConnect()
            } else {
                Log.log('WalletConnectService.on disconnect error unknown event')
            }
        })
        return walletConnector
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

    rejectRequest: async (walletConnector, payload) => {
        Log.log('WalletConnectService.rejectRequest', payload)
        walletConnector.rejectRequest({
            id: payload.id,
            error: {
                message: 'You have rejected request in Trustee Wallet'
            }
        })
    },

    killSession: async (walletConnector) => {
        Log.log('WalletConnectService.killSession', walletConnector)
        try {
            if (walletConnector.killSession !== 'undefined') {
                await walletConnector.killSession({
                    message: 'You have rejected session in TrusteeWallet'
                })
            }
        } catch (e) {
            if (e.message.indexOf('Missing or invalid topic field') !== -1) {
                walletConnectActions.resetWalletConnect()
            }
            Log.log('WalletConnectService.killSession error ' + e.message)
        }
    },

    rejectSession: async (walletConnector) => {
        Log.log('WalletConnectService.rejectSession')
        walletConnector.rejectSession({
            message: 'OPTIONAL_ERROR_MESSAGE'
        })
    },

    approveSession: async (walletConnector, payload, dappData = false) => {
        try {
            Log.log('WalletConnectService.approveSession payload', payload)
            BlocksoftCryptoLog.log('WalletConnectService.approveSession payload', payload)
            const { chainId } = payload
            const { data } = await walletConnectActions.getAndSetWalletConnectAccount(walletConnector, chainId)
            try {
                Log.log('WalletConnectService.approveSession data ' + JSON.stringify(data))
                await walletConnector.approveSession(data)
            } catch (e1) {
                if (e1.message.indexOf('Session currently connected') === -1) {
                    throw e1
                }
            }
            await walletConnector.updateSession(data)
            trusteeAsyncStorage.setWalletConnectSession({session : walletConnector.session, dappData})

            Log.log('WalletConnectService.approveSession finish', data)
            BlocksoftCryptoLog.log('WalletConnectService.approveSession finish', data)
            return data
        } catch (e) {
            Log.err('WalletConnectService.approveSession error ' + e.message)
        }
    },

    updateSession: async (walletConnector, payload) => {
        Log.log('WalletConnectService.updateSession', payload)
        BlocksoftCryptoLog.log('WalletConnectService.updateSession', payload)
        const { chainId } = payload
        const { data } = await walletConnectActions.getAndSetWalletConnectAccount(walletConnector, chainId)
        try {
            await walletConnector.updateSession(data)
            Log.log('WalletConnectService.updateSession finish', data)
            BlocksoftCryptoLog.log('WalletConnectService.updateSession finish', data)
            return data
        } catch (e) {
            Log.err('WalletConnectService.updateSession error ' + e.message)
        }
    }
}

export default walletConnectService