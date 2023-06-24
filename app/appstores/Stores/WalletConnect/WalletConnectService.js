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
    handleSessionRequestModal
} from '@app/appstores/Stores/WalletConnect/helpers'
import { Web3Injected } from '@crypto/services/Web3Injected'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'


import * as BlocksoftRandom from 'react-native-blocksoft-random'
import { fromString } from 'uint8arrays/from-string'
import * as relayAuth from '@walletconnect/relay-auth'
import { ONE_DAY } from '@walletconnect/time'
import { getRelayProtocolApi, isValidArray, isExpired, getSdkError, hashMessage, getRelayProtocolName} from '@walletconnect/utils'

import { Core } from '@walletconnect/core'
import { Web3Wallet } from '@walletconnect/web3wallet'

const EXPIRER_EVENTS = {
    created: 'expirer_created',
    deleted: 'expirer_deleted',
    expired: 'expirer_expired',
    sync: 'expirer_sync'
}

const RELAYER_EVENTS = {
    message: 'relayer_message',
    message_ack: 'relayer_message_ack',
    connect: 'relayer_connect',
    disconnect: 'relayer_disconnect',
    error: 'relayer_error',
    connection_stalled: 'relayer_connection_stalled',
    transport_closed: 'relayer_transport_closed',
    publish: 'relayer_publish'
}

const SUBSCRIBER_EVENTS = {
    created: 'subscription_created',
    deleted: 'subscription_deleted',
    expired: 'subscription_expired',
    disabled: 'subscription_disabled',
    sync: 'subscription_sync',
    resubscribed: 'subscription_resubscribed'
}

const WC_PROJECT_ID = 'daa39ed4fa0978cc19a9c9c0a2a7015c' // https://cloud.walletconnect.com/app/project

let core, web3wallet = false
const walletConnectService = {

    _init: async () => {
        core = new Core({
            // logger: 'debug',
            projectId: WC_PROJECT_ID,
            relayUrl: 'wss://relay.walletconnect.com'
        })
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
        core.expirer.has = (key) => {
            try {
                const target = core.formatTarget(key)
                const expiration = core.expirer.getExpiration(target)
                return typeof expiration !== 'undefined'
            } catch (e) {
                // ignore
                return false
            }
        }

        core.expirer.set = (key, expiry) => {
            try {
                core.expirer.isInitialized()
                const target = core.expirer.formatTarget(key)
                const expiration = { target, expiry }
                core.expirer.expirations.set(target, expiration)
                core.expirer.checkExpiry(target, expiration)
                core.expirer.events.emit(EXPIRER_EVENTS.created, {
                    target,
                    expiration
                })
            } catch (e) {
                console.log('core.expirer.set error ' + e.message)
            }
        }

        core.expirer.get = (key) => {
            try {
                core.expirer.isInitialized()
                const target = core.expirer.formatTarget(key)
                return core.expirer.getExpiration(target)
            } catch (e) {
                console.log('core.expirer.get error ' + e.message)
            }
        }

        core.expirer.del = (key) => {
            try {
                core.expirer.isInitialized()
                const exists = core.expirer.has(key)
                if (exists) {
                    const target = core.expirer.formatTarget(key)
                    const expiration = core.expirer.getExpiration(target)
                    core.expirer.expirations.delete(target)
                    core.expirer.events.emit(EXPIRER_EVENTS.deleted, {
                        target,
                        expiration
                    })
                }
            } catch (e) {
                console.log('core.expirer.del error ' + e.message)
            }
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

        core.relayer.subscriber.subscribe = async (topic, opts) => {
            await core.relayer.subscriber.restartToComplete();
            core.relayer.subscriber.isInitialized();
            core.relayer.subscriber.logger.debug(`Subscribing Topic`);
            core.relayer.subscriber.logger.trace({ type: "method", method: "subscribe", params: { topic, opts } });
            let relay, params, id
            try {
                relay = getRelayProtocolName(opts);
                params = { topic, relay };
                core.relayer.subscriber.pending.set(topic, params);
            } catch (e) {
                core.relayer.subscriber.logger.debug(`Failed to Subscribe Topic`)
                console.log('core.relayer.subscriber.subscribe error 1 ' + e.message)
                return false
            }
            try {
                id = await core.relayer.subscriber.rpcSubscribe(topic, relay);
            } catch (e) {
                core.relayer.subscriber.logger.debug(`Failed to Subscribe Topic`)
                console.log('core.relayer.subscriber.subscribe error 2 ' + e.message)
                return false
            }
            try {
                core.relayer.subscriber.onSubscribe(id, params);
                core.relayer.subscriber.logger.debug(`Successfully Subscribed Topic`);
                core.relayer.subscriber.logger.trace({ type: "method", method: "subscribe", params: { topic, opts } });
                return id;
            } catch (e) {
                core.relayer.subscriber.logger.debug(`Failed to Subscribe Topic`)
                console.log('core.relayer.subscriber.subscribe error 3 ' + e.message)
            }
        };

        core.relayer.subscriber.onSubscribe = (id, params) => {
            try {
                core.relayer.subscriber.setSubscription(id, { ...params, id })
            } catch (e) {
                console.log('core.relayer.subscriber.onSubscribe error 1 ' + e.message)
            }
            try {
                core.relayer.subscriber.pending.delete(params.topic)
            } catch (e) {
                console.log('core.relayer.subscriber.onSubscribe error 2 ' + e.message)
            }
        }

        core.relayer.subscriber.restart = async () => {
            core.relayer.subscriber.restartInProgress = true
            try {
                await core.relayer.subscriber.restore()
            } catch (e) {
                console.log('core.relayer.subscriber.restore error ' + e.message)
            }
            try {
                await core.relayer.subscriber.reset()
            } catch (e) {
                console.log('core.relayer.subscriber.reset error ' + e.message)
            }
            core.relayer.subscriber.restartInProgress = false
        }
        core.relayer.subscriber.reset = async () => {
            if (core.relayer.subscriber.cached.length) {
                const batches = Math.ceil(core.relayer.subscriber.cached.length / core.relayer.subscriber.batchSubscribeTopicsLimit)
                for (let i = 0; i < batches; i++) {
                    const batch = core.relayer.subscriber.cached.splice(0, core.relayer.subscriber.batchSubscribeTopicsLimit)
                    try {
                        await core.relayer.subscriber.batchSubscribe(batch)
                    } catch (e) {
                        console.log('core.relayer.subscriber.batchSubscribe error ' + e.message)
                    }

                }
            }
            core.relayer.subscriber.events.emit(SUBSCRIBER_EVENTS.resubscribed)
        }
        core.relayer.subscriber.batchSubscribe = async (subscriptions) => {
            if (!subscriptions.length) return
            let result
            try {
                result = await core.relayer.subscriber.rpcBatchSubscribe(subscriptions)
            } catch (e) {
                console.log('core.relayer.subscriber.rpcBatchSubscribe error ' + e.message)
            }
            try {
                if (!isValidArray(result)) return
            } catch (e) {
                console.log('core.relayer.subscriber.isValidArray error ' + e.message)
            }
            try {
                core.relayer.subscriber.onBatchSubscribe(result.map((id, i) => ({ ...subscriptions[i], id })))
            } catch (e) {
                console.log('core.relayer.subscriber.onBatchSubscribe error ' + e.message)
            }
        }

        core.relayer.subscriber.rpcSubscribe = async (topic, relay) => {
            const api = getRelayProtocolApi(relay.protocol);
            const request = {
                method: api.subscribe,
                params: {
                    topic,
                },
            };
            core.relayer.subscriber.logger.debug(`Outgoing Relay Payload`);
            core.relayer.subscriber.logger.trace({ type: "payload", direction: "outgoing", request })

            let request2
            try {
                request2 =  core.relayer.subscriber.relayer.request(request)
            } catch (err) {
                console.log('core.relayer.subscriber.rpcSubscribe error 4.1 ' + err.message)
            }

            let subscribe
            try {
                // fix is here!
                // eslint-disable-next-line no-async-promise-executor
                subscribe = new Promise(async (resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('expired')), core.relayer.subscriber.subscribeTimeout)
                    try {
                        const result = await request2
                        resolve(result)
                    } catch (error) {
                        reject(error)
                    }
                    clearTimeout(timeout)
                })
            } catch (err) {
                console.log('core.relayer.subscriber.rpcSubscribe error 4.2 ' + err.message, core.relayer.subscriber.subscribeTimeout)
                core.relayer.subscriber.logger.debug(`Outgoing Relay Subscribe Payload stalled`);
                core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled);
            }
            try {
                const res = await subscribe
                console.log(`
                
                SUBSCRIBED 1 res `, res)
                return res
            } catch (err) {
                // and here also is the fix
                console.log('core.relayer.subscriber.rpcSubscribe error 4.3 ' + err.message)
                core.relayer.subscriber.logger.debug(`Outgoing Relay Subscribe Payload stalled`);
                core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled);
            }

            try {
                const hash = hashMessage(topic + core.relayer.subscriber.clientId)
                return hash
            } catch (e) {
                console.log('core.relayer.subscriber.rpcSubscribe error 4.4 ' + e.message)
            }
        }
        
        core.relayer.subscriber.rpcBatchSubscribe = async (subscriptions) => {
            if (!subscriptions.length) return

            let relay, api, request
            try {
                relay = subscriptions[0].relay
            } catch (e) {
                console.log('core.relayer.subscriber.rpcBatchSubscribe error 1 ' + e.message)
                return false
            }
            try {
                api = getRelayProtocolApi(relay.protocol)
            } catch (e) {
                console.log('core.relayer.subscriber.rpcBatchSubscribe error 2 ' + e.message)
                return false
            }
            try {
                request = {
                    method: api.batchSubscribe,
                    params: {
                        topics: subscriptions.map((s) => s.topic)
                    }
                }
            } catch (e) {
                console.log('core.relayer.subscriber.rpcBatchSubscribe error 3 ' + e.message)
                return false
            }
            core.relayer.subscriber.logger.debug(`Outgoing Relay Payload`)
            core.relayer.subscriber.logger.trace({ type: 'payload', direction: 'outgoing', request })

            let request2
            try {
                request2 = core.relayer.subscriber.relayer.request(request)
            } catch (err) {
                console.log('core.relayer.subscriber.rpcBatchSubscribe error 4.1 ' + err.message)
                core.relayer.subscriber.logger.debug(`Outgoing Relay Payload stalled`)
                core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
            }
            let subscribe
            try {
                // fix is here!
                // eslint-disable-next-line no-async-promise-executor
                subscribe = new Promise(async (resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('expired')), core.relayer.subscriber.subscribeTimeout)
                    try {
                        const result = await request2
                        resolve(result)
                    } catch (error) {
                        reject(error)
                    }
                    clearTimeout(timeout)
                })
            } catch (err) {
                console.log('core.relayer.subscriber.rpcBatchSubscribe error 4.2 ' + err.message, core.relayer.subscriber.subscribeTimeout)
                core.relayer.subscriber.logger.debug(`Outgoing Relay Payload stalled`)
                core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
            }
            try {
                const res = await subscribe
                console.log(`
                
                SUBSCRIBED 2 res `, res)
                return res
            } catch (err) {
                // and here also is the fix
                console.log('core.relayer.subscriber.rpcBatchSubscribe error 4.3 ' + err.message)
                // core.relayer.subscriber.logger.debug(`Outgoing Relay Payload stalled`)
                // core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
            }
        }
        core.relayer.subscriber.init = async () => {
            if (!core.relayer.subscriber.initialized) {
                core.relayer.subscriber.logger.trace(`Initialized`)
                try {
                    await core.relayer.subscriber.restart()
                } catch (e) {
                    console.log('core.relayer.subscriber.restart error ' + e.message)
                }
                try {
                    core.relayer.subscriber.registerEventListeners()
                } catch (e) {
                    console.log('core.relayer.subscriber.registerEventListeners error ' + e.message)
                }
                try {
                    core.relayer.subscriber.onEnable()
                } catch (e) {
                    console.log('core.relayer.subscriber.onEnable error ' + e.message)
                }
                try {
                    core.relayer.subscriber.clientId = await core.crypto.getClientId()
                } catch (e) {
                    console.log('core.relayer.subscriber.clientId error ' + e.message)
                }
            }
        }
        core.relayer.init = async () => {
            try {
                await core.relayer.createProvider()
            } catch (e) {
                console.log('core.relayer.init error 1 ' + e.message)
            }
            try {
                await core.relayer.messages.init()
            } catch (e) {
                console.log('core.relayer.init error 2.1 ' + e.message)
            }
            try {
                await core.relayer.transportOpen()
            } catch (e) {
                console.log('core.relayer.init error 2.2 ' + e.message)
            }
            try {
                await core.relayer.subscriber.init()
            } catch (e) {
                console.log('core.relayer.init error 2.3 ' + e.message)
            }
            try {
                core.relayer.registerEventListeners()
                core.relayer.initialized = true
            } catch (e) {
                console.log('core.relayer.init error 3 ' + e.message)
            }
            try {
                setTimeout(async () => {
                    try {
                        if (core.relayer.subscriber.topics.length === 0) {
                            core.relayer.logger.info(`No topics subscribted to after init, closing transport`)
                            await core.relayer.transportClose()
                            core.relayer.transportExplicitlyClosed = false
                        }
                    } catch (e) {
                        console.log('core.relayer.init error 4.1 ' + e.message)
                    }
                }, 10000)
            } catch (e) {
                console.log('core.relayer.init error 4 ' + e.message)
            }
        }

        core.relayer.unsubscribe = async(topic, opts) => {
            try {
                core.relayer.isInitialized()
            } catch (e) {
                console.log('core.relayer.unsubscribe error 1 ' + e.message)
                return false
            }
            try {
                await core.relayer.subscriber.unsubscribe(topic, opts)
            } catch (e) {
                console.log('core.relayer.unsubscribe error 2 ' + e.message)
                return false
            }
        }


        core.pairing.deletePairing = async (topic, expirerHasDeleted) => {
            try {
                await core.relayer.unsubscribe(topic, {})
            } catch (e) {
                console.log('core.pairing.deletePairing error 1 ' + e.message)
                return false
            }
            try {
                await core.pairing.pairings.delete(topic, getSdkError('USER_DISCONNECTED'))
            } catch (e) {
                console.log('core.pairing.deletePairing error 2 ' + e.message)
                return false
            }
            try {
                await core.pairing.core.crypto.deleteSymKey(topic)
            } catch (e) {
                console.log('core.pairing.deletePairing  error 3 ' + e.message)
                return false
            }
            try {
                await expirerHasDeleted ? Promise.resolve() : core.pairing.core.expirer.del(topic)
            } catch (e) {
                console.log('core.pairing.deletePairing  error 4 ' + e.message)
                return false
            }
        }

        core.pairing.cleanup = async () => {
            let expiredPairings = false
            try {
                expiredPairings = core.pairing.pairings.getAll().filter((pairing) => isExpired(pairing.expiry))
            } catch (e) {
                console.log('core.pairing.cleanup error 1 ' + e.message)
                return false
            }
            try {
                await Promise.all(expiredPairings.map((pairing) => core.pairing.deletePairing(pairing.topic)))
            } catch (e) {
                console.log('core.pairing.cleanup error 2 ' + e.message)
            }
        }


        core.pairing.init = async () => {
            if (!core.pairing.initialized) {
                try {
                    await core.pairing.pairings.init()
                } catch (e) {
                    console.log('core.pairing.init error 1 ' + e.message)
                }
                try {
                    await core.pairing.cleanup()
                } catch (e) {
                    console.log('core.pairing.init error 2 ' + e.message)
                }
                try {
                    core.pairing.registerRelayerEvents()
                } catch (e) {
                    console.log('core.pairing.init error 3 ' + e.message)
                }
                try {
                    core.pairing.registerExpirerEvents()
                } catch (e) {
                    console.log('core.pairing.init error 4 ' + e.message)
                }
                core.pairing.initialized = true
                core.pairing.logger.trace(`Initialized`)
            }
        }


        web3wallet = await Web3Wallet.init({
            core,
            metadata: {
                name: 'React Native Web3Wallet',
                description: 'ReactNative Web3Wallet',
                url: 'https://walletconnect.com/',
                icons: ['https://avatars.githubusercontent.com/u/37784886']
            }
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
    },

    createAndConnect: async (fullLink, session, dappData) => {
        if (web3wallet === false) {
            await walletConnectService._init()
        }
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
            trusteeAsyncStorage.setWalletConnectSession({ session: walletConnector.session, dappData })

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
