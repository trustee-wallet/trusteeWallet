/**
 * @version 1.0
 */
import Log from '@app/services/Log/Log'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import * as BlocksoftRandom from 'react-native-blocksoft-random'
import { fromString } from 'uint8arrays/from-string'

import * as relayAuth from '@walletconnect/relay-auth'
import { ONE_DAY } from '@walletconnect/time'
import {
    getRelayProtocolApi,
    getRelayProtocolName,
    getSdkError,
    hashMessage,
    isExpired,
    isValidArray,
    deriveSymKey,
    generateKeyPair as generateKeyPairUtil
} from '@walletconnect/utils'

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

export default (core) => {
    core.crypto.keychain.set = async (tag, key) => {
        try {
            core.crypto.keychain.isInitialized()
            core.crypto.keychain.keychain[tag] = key
            await core.crypto.keychain.persist()
        } catch (e) {
            Log.log(`core.crypto.keychain.set ` + e.message)
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
            Log.log('core.expirer.set error ' + e.message)
        }
    }

    core.expirer.get = (key) => {
        try {
            core.expirer.isInitialized()
            const target = core.expirer.formatTarget(key)
            return core.expirer.getExpiration(target)
        } catch (e) {
            Log.log('core.expirer.get error ' + e.message)
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
            Log.log('core.expirer.del error ' + e.message)
        }
    }


    core.crypto.generateKeyPair = () => {
        try {
            core.crypto.isInitialized()
            const keyPair = generateKeyPairUtil()
            return core.crypto.setPrivateKey(keyPair.publicKey, keyPair.privateKey)
        } catch (e) {
            Log.log('core.crypto.generateKeyPair error ' + e.message)
        }
    }
    core.crypto.generateSharedKey = (
        selfPublicKey,
        peerPublicKey,
        overrideTopic
    ) => {
        try {
            core.crypto.isInitialized()
            const selfPrivateKey = core.crypto.getPrivateKey(selfPublicKey)
            const symKey = deriveSymKey(selfPrivateKey, peerPublicKey)
            return core.crypto.setSymKey(symKey, overrideTopic)
        } catch (e) {
            Log.log('core.crypto.generateSharedKey error ' + e.message)
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
        await core.relayer.subscriber.restartToComplete()
        core.relayer.subscriber.isInitialized()
        core.relayer.subscriber.logger.debug(`Subscribing Topic`)
        core.relayer.subscriber.logger.trace({ type: 'method', method: 'subscribe', params: { topic, opts } })
        let relay, params, id
        try {
            relay = getRelayProtocolName(opts)
            params = { topic, relay }
            core.relayer.subscriber.pending.set(topic, params)
        } catch (e) {
            core.relayer.subscriber.logger.debug(`Failed to Subscribe Topic`)
            Log.log('core.relayer.subscriber.subscribe error 1 ' + e.message)
            return false
        }
        if (typeof relay === 'undefined' || typeof relay.protocol === 'undefined') {
            relay = { 'protocol': 'irn' }
        }
        try {
            id = await core.relayer.subscriber.rpcSubscribe(topic, relay)
        } catch (e) {
            core.relayer.subscriber.logger.debug(`Failed to Subscribe Topic`)
            Log.log('core.relayer.subscriber.subscribe error 2 ' + e.message + ' relay ' + relay)
            return false
        }
        try {
            core.relayer.subscriber.onSubscribe(id, params)
            core.relayer.subscriber.logger.debug(`Successfully Subscribed Topic`)
            core.relayer.subscriber.logger.trace({ type: 'method', method: 'subscribe', params: { topic, opts } })
            return id
        } catch (e) {
            core.relayer.subscriber.logger.debug(`Failed to Subscribe Topic`)
            Log.log('core.relayer.subscriber.subscribe error 3 ' + e.message)
        }
    }

    core.relayer.subscriber.unsubscribe = async (topic, opts) => {
        try {
            await core.relayer.subscriber.restartToComplete()
        } catch (e) {
            Log.log('core.relayer.subscriber.unsubscribe error 1 ' + e.message)
        }
        try {
            core.relayer.subscriber.isInitialized()
        } catch (e) {
            Log.log('core.relayer.subscriber.unsubscribe error 2 ' + e.message)
        }
        if (typeof opts?.id !== 'undefined') {
            try {
                await core.relayer.subscriber.unsubscribeById(topic, opts.id, opts)
            } catch (e) {
                Log.log('core.relayer.subscriber.unsubscribe error 3.1 ' + e.message)
            }
        } else {
            try {
                await core.relayer.subscriber.unsubscribeByTopic(topic, opts)
            } catch (e) {
                Log.log('core.relayer.subscriber.unsubscribe error 3.2 ' + e.message)
            }
        }
    }

    core.relayer.subscriber.unsubscribeByTopic = async (topic, opts) => {
        let ids = false
        try {
            ids = core.relayer.subscriber.topicMap.get(topic)
        } catch (e) {
            Log.log('core.relayer.subscriber.topicMap.get error  ' + e.message)
        }
        if (ids) {
            for (const index in ids) {
                try {
                    await core.relayer.subscriber.unsubscribeById(topic, ids[index], opts)
                } catch (e) {
                    Log.log('core.relayer.subscriber.unsubscribeById error  ' + e.message + ' ' + ids[index])
                }
            }
        }
    }

    core.relayer.subscriber.unsubscribeById = async (topic, id, opts) => {
        core.relayer.subscriber.logger.debug(`Unsubscribing Topic`)
        core.relayer.subscriber.logger.trace({ type: 'method', method: 'unsubscribe', params: { topic, id, opts } })
        let relay
        try {
            relay = getRelayProtocolName(opts)
        } catch (e) {
            Log.log('core.relayer.subscriber.unsubscribeById error 3.1 ' + e.message)
            return false
        }
        try {
            await core.relayer.subscriber.rpcUnsubscribe(topic, id, relay)
        } catch (e) {
            Log.log('core.relayer.subscriber.unsubscribeById error 3.2 ' + e.message)
            return false
        }
        try {
            const reason = getSdkError('USER_DISCONNECTED', `${core.relayer.subscriber.name}, ${topic}`)
            await core.relayer.subscriber.onUnsubscribe(topic, id, reason)
        } catch (e) {
            Log.log('core.relayer.subscriber.unsubscribeById error 3.3 ' + e.message)
            return false
        }
        try {
            core.relayer.subscriber.logger.debug(`Successfully Unsubscribed Topic`)
            core.relayer.subscriber.logger.trace({ type: 'method', method: 'unsubscribe', params: { topic, id, opts } })
        } catch (e) {
            core.relayer.subscriber.logger.debug(`Failed to Unsubscribe Topic`)
            Log.log('core.relayer.subscriber.unsubscribeById error 3.4 ' + e.message)
        }
    }

    core.relayer.subscriber.onSubscribe = (id, params) => {
        try {
            core.relayer.subscriber.setSubscription(id, { ...params, id })
        } catch (e) {
            Log.log('core.relayer.subscriber.onSubscribe error 1 ' + e.message)
        }
        try {
            core.relayer.subscriber.pending.delete(params.topic)
        } catch (e) {
            Log.log('core.relayer.subscriber.onSubscribe error 2 ' + e.message)
        }
    }


    core.relayer.subscriber.onUnsubscribe = async (topic, id, reason) => {
        try {
            core.relayer.subscriber.events.removeAllListeners(id)
        } catch (e) {
            Log.log('core.relayer.subscriber.onUnsubscribe error 1 ' + e.message)
        }
        let t = false
        try {
            t = core.relayer.subscriber.hasSubscription(id, topic)
        } catch (e) {
            Log.log('core.relayer.subscriber.onUnsubscribe error 2 ' + e.message)
        }
        try {
            if (t) {
                core.relayer.subscriber.deleteSubscription(id, reason)
            }
        } catch (e) {
            Log.log('core.relayer.subscriber.onUnsubscribe error 3 ' + e.message)
        }
        try {
            await core.relayer.subscriber.relayer.messages.del(topic)
        } catch (e) {
            Log.log('core.relayer.subscriber.onUnsubscribe error 4 ' + e.message)
        }
    }


    core.relayer.subscriber.relayer.messages.del = async (topic) => {
        try {
            core.relayer.subscriber.relayer.messages.isInitialized()
        } catch (e) {
            Log.log('core.relayer.subscriber.relayer.messages.del error 1 ' + e.message)
        }
        try {
            core.relayer.subscriber.relayer.messages.messages.delete(topic)
        } catch (e) {
            Log.log('core.relayer.subscriber.relayer.messages.del error 2 ' + e.message)
        }
        try {
            await core.relayer.subscriber.relayer.messages.persist()
        } catch (e) {
            Log.log('core.relayer.subscriber.relayer.messages.del error 3 ' + e.message)
        }
    }

    core.relayer.subscriber.deleteSubscription = (id, reason) => {
        let subscription
        try {
            subscription = core.relayer.subscriber.getSubscription(id)
        } catch (e) {
            Log.log('core.relayer.subscriber.deleteSubscription error 1 ' + e.message)
        }
        try {
            core.relayer.subscriber.subscriptions.delete(id)
        } catch (e) {
            Log.log('core.relayer.subscriber.deleteSubscription error 2 ' + e.message)
        }
        if (subscription) {
            try {
                core.relayer.subscriber.topicMap.delete(subscription.topic, id)
            } catch (e) {
                Log.log('core.relayer.subscriber.deleteSubscription error 3 ' + e.message)
            }
            try {
                core.relayer.subscriber.events.emit(SUBSCRIBER_EVENTS.deleted, {
                    ...subscription,
                    reason
                })
            } catch (e) {
                Log.log('core.relayer.subscriber.deleteSubscription error 4 ' + e.message)
            }
        }
    }

    core.relayer.subscriber.restart = async () => {
        core.relayer.subscriber.restartInProgress = true
        try {
            await core.relayer.subscriber.restore()
        } catch (e) {
            Log.log('core.relayer.subscriber.restore error ' + e.message)
        }
        try {
            await core.relayer.subscriber.reset()
        } catch (e) {
            Log.log('core.relayer.subscriber.reset error ' + e.message)
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
                    Log.log('core.relayer.subscriber.batchSubscribe error ' + e.message)
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
            Log.log('core.relayer.subscriber.rpcBatchSubscribe error ' + e.message)
        }
        try {
            if (!isValidArray(result)) return
        } catch (e) {
            Log.log('core.relayer.subscriber.isValidArray error ' + e.message)
        }
        try {
            core.relayer.subscriber.onBatchSubscribe(result.map((id, i) => ({ ...subscriptions[i], id })))
        } catch (e) {
            Log.log('core.relayer.subscriber.onBatchSubscribe error ' + e.message)
        }
    }

    core.relayer.subscriber.rpcSubscribe = async (topic, relay) => {
        const api = getRelayProtocolApi(relay.protocol)
        const request = {
            method: api.subscribe,
            params: {
                topic
            }
        }
        core.relayer.subscriber.logger.debug(`Outgoing Relay Payload`)
        core.relayer.subscriber.logger.trace({ type: 'payload', direction: 'outgoing', request })

        let request2
        try {
            request2 = core.relayer.subscriber.relayer.request(request)
        } catch (err) {
            Log.log('core.relayer.subscriber.rpcSubscribe error 4.1 ' + err.message)
        }

        let subscribe
        try {
            // fix is here!
            // eslint-disable-next-line no-async-promise-executor
            subscribe = new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('expired by timeout')), 30000)
                try {
                    const result = await request2
                    resolve(result)
                } catch (error) {
                    reject(error)
                }
                clearTimeout(timeout)
            })
        } catch (err) {
            Log.log('core.relayer.subscriber.rpcSubscribe error 4.2 ' + err.message)
            core.relayer.subscriber.logger.debug(`Outgoing Relay Subscribe Payload stalled`)
            core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
        }
        try {
            const res = await subscribe
            return res
        } catch (err) {
            // and here also is the fix
            Log.log('core.relayer.subscriber.rpcSubscribe error 4.3 ' + err.message + ' topic ' + topic)
            core.relayer.subscriber.logger.debug(`Outgoing Relay Subscribe Payload stalled`)
            core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
        }

        try {
            const hash = hashMessage(topic + core.relayer.subscriber.clientId)
            return hash
        } catch (e) {
            Log.log('core.relayer.subscriber.rpcSubscribe error 4.4 ' + e.message)
        }
    }

    core.relayer.subscriber.rpcBatchSubscribe = async (subscriptions) => {
        if (!subscriptions.length) return

        let relay, api, request
        try {
            relay = subscriptions[0].relay
        } catch (e) {
            Log.log('core.relayer.subscriber.rpcBatchSubscribe error 1 ' + e.message)
            return false
        }
        try {
            api = getRelayProtocolApi(relay.protocol)
        } catch (e) {
            Log.log('core.relayer.subscriber.rpcBatchSubscribe error 2 ' + e.message)
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
            Log.log('core.relayer.subscriber.rpcBatchSubscribe error 3 ' + e.message)
            return false
        }
        core.relayer.subscriber.logger.debug(`Outgoing Relay Payload`)
        core.relayer.subscriber.logger.trace({ type: 'payload', direction: 'outgoing', request })

        let request2
        try {
            request2 = core.relayer.subscriber.relayer.request(request)
        } catch (err) {
            Log.log('core.relayer.subscriber.rpcBatchSubscribe error 4.1 ' + err.message)
            core.relayer.subscriber.logger.debug(`Outgoing Relay Payload stalled`)
            core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
        }
        let subscribe
        try {
            // fix is here!
            // eslint-disable-next-line no-async-promise-executor
            subscribe = new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('expired by timeout')), 30000)
                try {
                    const result = await request2
                    resolve(result)
                } catch (error) {
                    reject(error)
                }
                clearTimeout(timeout)
            })
        } catch (err) {
            Log.log('core.relayer.subscriber.rpcBatchSubscribe error 4.2 ' + err.message)
            core.relayer.subscriber.logger.debug(`Outgoing Relay Payload stalled`)
            core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
        }
        try {
            const res = await subscribe
            return res
        } catch (err) {
            // and here also is the fix
            Log.log('core.relayer.subscriber.rpcBatchSubscribe error 4.3 ' + err.message)
            core.relayer.subscriber.logger.debug(`Outgoing Relay Payload stalled`)
            core.relayer.subscriber.relayer.events.emit(RELAYER_EVENTS.connection_stalled)
        }
    }
    core.relayer.subscriber.init = async () => {
        if (!core.relayer.subscriber.initialized) {
            core.relayer.subscriber.logger.trace(`Initialized`)
            try {
                await core.relayer.subscriber.restart()
            } catch (e) {
                Log.log('core.relayer.subscriber.restart error ' + e.message)
            }
            try {
                core.relayer.subscriber.registerEventListeners()
            } catch (e) {
                Log.log('core.relayer.subscriber.registerEventListeners error ' + e.message)
            }
            try {
                core.relayer.subscriber.onEnable()
            } catch (e) {
                Log.log('core.relayer.subscriber.onEnable error ' + e.message)
            }
            try {
                core.relayer.subscriber.clientId = await core.crypto.getClientId()
            } catch (e) {
                Log.log('core.relayer.subscriber.clientId error ' + e.message)
            }
        }
    }
    core.relayer.init = async () => {
        try {
            await core.relayer.createProvider()
        } catch (e) {
            Log.log('core.relayer.init error 1 ' + e.message)
        }
        try {
            await core.relayer.messages.init()
        } catch (e) {
            Log.log('core.relayer.init error 2.1 ' + e.message)
        }
        try {
            await core.relayer.transportOpen()
        } catch (e) {
            Log.log('core.relayer.init error 2.2 ' + e.message)
        }
        try {
            await core.relayer.subscriber.init()
        } catch (e) {
            Log.log('core.relayer.init error 2.3 ' + e.message)
        }
        try {
            core.relayer.registerEventListeners()
            core.relayer.initialized = true
        } catch (e) {
            Log.log('core.relayer.init error 3 ' + e.message)
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
                    Log.log('core.relayer.init error 4.1 ' + e.message)
                }
            }, 10000)
        } catch (e) {
            Log.log('core.relayer.init error 4 ' + e.message)
        }
    }

    core.relayer.unsubscribe = async (topic, opts) => {
        try {
            core.relayer.isInitialized()
        } catch (e) {
            Log.log('core.relayer.unsubscribe error 1 ' + e.message)
            return false
        }
        try {
            await core.relayer.subscriber.unsubscribe(topic, opts)
        } catch (e) {
            Log.log('core.relayer.unsubscribe error 2 ' + e.message)
            return false
        }
    }


    core.pairing.deletePairing = async (topic, expirerHasDeleted) => {
        try {
            await core.relayer.unsubscribe(topic, {})
        } catch (e) {
            Log.log('core.pairing.deletePairing error 1 ' + e.message)
            return false
        }
        try {
            await core.pairing.pairings.delete(topic, getSdkError('USER_DISCONNECTED'))
        } catch (e) {
            Log.log('core.pairing.deletePairing error 2 ' + e.message)
            return false
        }
        try {
            await core.pairing.core.crypto.deleteSymKey(topic)
        } catch (e) {
            Log.log('core.pairing.deletePairing  error 3 ' + e.message)
            return false
        }
        try {
            await expirerHasDeleted ? Promise.resolve() : core.pairing.core.expirer.del(topic)
        } catch (e) {
            Log.log('core.pairing.deletePairing  error 4 ' + e.message)
            return false
        }
    }

    core.pairing.cleanup = async () => {
        let expiredPairings = false
        try {
            expiredPairings = core.pairing.pairings.getAll().filter((pairing) => isExpired(pairing.expiry))
        } catch (e) {
            Log.log('core.pairing.cleanup error 1 ' + e.message)
            return false
        }
        try {
            await Promise.all(expiredPairings.map((pairing) => core.pairing.deletePairing(pairing.topic)))
        } catch (e) {
            Log.log('core.pairing.cleanup error 2 ' + e.message)
        }
    }


    core.pairing.init = async () => {
        if (!core.pairing.initialized) {
            try {
                await core.pairing.pairings.init()
            } catch (e) {
                Log.log('core.pairing.init error 1 ' + e.message)
            }
            try {
                await core.pairing.cleanup()
            } catch (e) {
                Log.log('core.pairing.init error 2 ' + e.message)
            }
            try {
                core.pairing.registerRelayerEvents()
            } catch (e) {
                Log.log('core.pairing.init error 3 ' + e.message)
            }
            try {
                core.pairing.registerExpirerEvents()
            } catch (e) {
                Log.log('core.pairing.init error 4 ' + e.message)
            }
            core.pairing.initialized = true
            core.pairing.logger.trace(`Initialized`)
        }
    }

    return core
}