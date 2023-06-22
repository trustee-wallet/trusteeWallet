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


import * as BlocksoftRandom from 'react-native-blocksoft-random'
import { fromString } from 'uint8arrays/from-string'
import * as relayAuth from '@walletconnect/relay-auth'
import { ONE_DAY } from '@walletconnect/time'
import { isJsonRpcRequest, isJsonRpcResponse } from '@walletconnect/jsonrpc-utils'

import { Core } from '@walletconnect/core'
import { Web3Wallet } from '@walletconnect/web3wallet'

const RELAYER_EVENTS = {
    message: "relayer_message",
    message_ack: "relayer_message_ack",
    connect: "relayer_connect",
    disconnect: "relayer_disconnect",
    error: "relayer_error",
    connection_stalled: "relayer_connection_stalled",
    transport_closed: "relayer_transport_closed",
    publish: "relayer_publish",
}

const RELAYER_SUBSCRIBER_SUFFIX = "_subscription";

const RELAYER_PROVIDER_EVENTS = {
    payload: "payload",
    connect: "connect",
    disconnect: "disconnect",
    error: "error",
}

const WC_PROJECT_ID = 'daa39ed4fa0978cc19a9c9c0a2a7015c' // https://cloud.walletconnect.com/app/project

let core, web3wallet
const walletConnectService = {

    createAndConnect: async (fullLink, session, dappData) => {

        console.log(`
        
        
        CREATED2`)

        core = new Core({
            // logger: 'debug',
            projectId: WC_PROJECT_ID,
            relayUrl: 'wss://relay.walletconnect.com',
        });
        core.crypto.keychain.set = async (tag, key) => {
            try {
                core.crypto.keychain.isInitialized()
                core.crypto.keychain.keychain[tag] = key
                await core.crypto.keychain.persist()
            } catch (e) {
                console.log(`core.crypto.keychain.set ` + e.message)
            }
        }
        core.crypto.keychain.get = (tag) => {
            if (typeof core.crypto.keychain.keychain[tag] === 'undefined') {
                return false
            }
            return core.crypto.keychain.keychain[tag]
        }
        core.crypto.keychain.has = (tag) => {
            if (typeof core.crypto.keychain.keychain[tag] === 'undefined') {
                return false
            }
            return true
        }
        core.crypto.keychain.del = async (tag) => {
            if (typeof core.crypto.keychain.keychain[tag] === 'undefined') {
                return false
            }
            delete core.crypto.keychain.keychain[tag]
            await core.crypto.keychain.persist()
        }
        core.crypto.keychain.setKeyChain = async (keychain) => {
            await trusteeAsyncStorage.setWalletConnectKC(keychain)
        }
        core.crypto.keychain.getKeyChain = async () => {
            return trusteeAsyncStorage.getWalletConnectKC()
        }


        core.crypto.getClientSeed = async () => {
            let seed = ''
            try {
                seed = await core.crypto.keychain.get('client_ed25519_seed')
            } catch {
            }
            if (!seed) {
                seed = await BlocksoftRandom.getRandomBytes(32)
                await core.crypto.keychain.set('client_ed25519_seed', seed)
            }
            let random
            try {
                random = fromString(seed, 'base64')
            } catch (e) {
                seed = await BlocksoftRandom.getRandomBytes(32)
                await core.crypto.keychain.set('client_ed25519_seed', seed)
            }
            return random
        }
        core.crypto.signJWT = async (aud) => {
            core.crypto.isInitialized()
            let seed
            try {
                seed = await core.crypto.getClientSeed()
            } catch (e) {
                throw new Error(e.message + ' in  core.crypto.getClientSeed')
            }
            const keyPair = relayAuth.generateKeyPair(seed)
            const sub = await BlocksoftRandom.getRandomBytes(32)
            const ttl = ONE_DAY
            const jwt = await relayAuth.signJWT(sub, aud, ttl, keyPair)
            return jwt
        }

        core.relayer.request = async (request) => {
            core.logger.debug(`Publishing Request Payload 1`);
            console.log('request ', request)
            if (typeof request?.params?.topics !== 'undefined') {
                if (request?.params?.topics.length === 1 && request?.params?.topics[0].length<64) {
                    return false
                }
            }
            try {
                await core.relayer.toEstablishConnection();
                return await core.relayer.provider.request(request);
            } catch (e) {
                core.logger.debug(`Failed to Publish Request 1`);
                core.logger.error(e);
            }
        };
        core.relayer.onProviderPayload = async (payload) => {
            core.logger.debug(`Incoming Relay Payload 1`)
            if (JSON.stringify(payload).indexOf('Topic decoding failed') !== -1) {
                console.log('bad response', JSON.stringify(payload.error.message))
                return
            }
            console.log('response', payload)
            core.relayer.logger.trace({ type: "payload", direction: "incoming", payload })
            if (isJsonRpcRequest(payload)) {
                if (!payload.method.endsWith(RELAYER_SUBSCRIBER_SUFFIX)) return
                const event = payload.params
                const { topic, message, publishedAt } = event.data
                const messageEvent = { topic, message, publishedAt }
                core.logger.debug(`Emitting Relayer Payload 1`)
                core.logger.trace({ type: 'event', event: event.id, ...messageEvent })
                core.relayer.events.emit(event.id, messageEvent)
                await core.relayer.acknowledgePayload(payload)
                await core.relayer.onMessageEvent(messageEvent)
            } else if (isJsonRpcResponse(payload)) {
                core.relayer.events.emit(RELAYER_EVENTS.message_ack, payload)
            }
        }

        core.relayer.registerProviderListeners = () => {
            core.relayer.provider.on(RELAYER_PROVIDER_EVENTS.payload, (payload) =>
                core.relayer.onProviderPayload(payload),
            );
            core.relayer.provider.on(RELAYER_PROVIDER_EVENTS.connect, () => {
                core.relayer.events.emit(RELAYER_EVENTS.connect);
            });
            core.relayer.provider.on(RELAYER_PROVIDER_EVENTS.disconnect, () => {
                core.relayer.onProviderDisconnect();
            });
            core.relayer.provider.on(RELAYER_PROVIDER_EVENTS.error, (err) => {
                // core.relayer.logger.error(err);
                // core.relayer.events.emit(RELAYER_EVENTS.error, err);
            });
        }
        
        
        web3wallet = await Web3Wallet.init({
            core,
            metadata: {
                name: 'React Native Web3Wallet',
                description: 'ReactNative Web3Wallet',
                url: 'https://walletconnect.com/',
                icons: ['https://avatars.githubusercontent.com/u/37784886'],
            },
        })

        web3wallet.on('session_proposal', async (proposal) => {
            console.log('session_proposal', proposal)
        })
        web3wallet.on('session_request', (event) => {
            console.log('session_request', event)
        })
        web3wallet.on('session_delete', (event) => {
            console.log('session_delete', event)
        })
        web3wallet.on('auth_request', async (event) => {
            console.log('auth_request', event)
        })

        const params = { uri: fullLink, activatePairing: true }
        try {
            await web3wallet.core.pairing.pair(params)
        } catch (e) {
            if (e.message.indexOf('Pairing already exists') !== -1 || e.message.indexOf('Keychain already exists') !== -1) {
                // do nothing
                console.log(`
                
                ALREADY ` + e.message)
            } else if (e.message.indexOf('Request validation') !== -1) {
                // do nothing
                console.log(`
                
                Request ` + e.message)
            } else {
                throw new Error(e.message + ' in web3wallet.core.pairing.pair')
            }
        }

        return web3wallet
        /*
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
                    walletConnectActions.getAndSetWalletConnectAccountNetwork(walletConnector, chainId, 'call_request')

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

         */
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
