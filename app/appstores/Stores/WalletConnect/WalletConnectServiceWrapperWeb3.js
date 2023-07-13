/**
 * @version 1.0
 */
import Log from '@app/services/Log/Log'
import { getRequiredNamespacesFromNamespaces, getSdkError, isValidObject } from '@walletconnect/utils'


import { getBigIntRpcId } from '@walletconnect/jsonrpc-utils'

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

export default (web3wallet) => {

    web3wallet.engine.signClient.engine.disconnect = async (params) => {
        try {
            web3wallet.engine.signClient.engine.isInitialized()
            await web3wallet.engine.signClient.engine.isValidDisconnect(params)
        } catch (e) {
            Log.log(`web3wallet.engine.signClient.engine.disconnect error 1 ` + e.message)
        }
        const { topic } = params

        let has = false
        try {
            has = web3wallet.engine.signClient.engine.client.session.keys.includes(topic)
        } catch (e) {
            Log.log(`web3wallet.engine.signClient.engine.disconnect error 2 ` + e.message)
        }
        if (has) {
            let id = 0
            try {
                id = getBigIntRpcId().toString()
            } catch (e) {
                Log.log(`web3wallet.engine.signClient.engine.disconnect error 3.1 ` + e.message)
            }

            /*
            let resolvePromise
            const onDisconnectAck = (ack) => {
                if (ack?.id.toString() === id) {
                    web3wallet.engine.signClient.engine.client.core.relayer.events.removeListener(
                        RELAYER_EVENTS.message_ack,
                        onDisconnectAck
                    )
                    resolvePromise()
                }
            }

            try {
                // await a relay ACK on the disconnect req before deleting the session, keychain etc.
                await new Promise((resolve) => {
                    resolvePromise = resolve
                    web3wallet.engine.signClient.engine.client.core.relayer.on(RELAYER_EVENTS.message_ack, onDisconnectAck)
                })
            } catch (e) {
                Log.log(`web3wallet.engine.signClient.engine.disconnect error 3.2 ` + e.message)
            }
            */

            try {
                await web3wallet.engine.signClient.engine.sendRequest(
                    topic,
                    'wc_sessionDelete',
                    getSdkError('USER_DISCONNECTED'),
                    undefined,
                    id
                )
            } catch (e) {
                Log.log(`web3wallet.engine.signClient.engine.disconnect error 3.3 ` + e.message)
            }

            try {
                await web3wallet.engine.signClient.engine.deleteSession(topic)
            } catch (e) {
                Log.log(`web3wallet.engine.signClient.engine.disconnect error 3.4 ` + e.message)
            }
        } else {
            try {
                await web3wallet.engine.signClient.engine.client.core.pairing.disconnect({ topic })
            } catch (e) {
                Log.log(`web3wallet.engine.signClient.engine.disconnect error 4 ` + e.message)
            }
        }
    }

    web3wallet.engine.signClient.engine.approve = async (params) => {
        try {
            web3wallet.engine.signClient.engine.isInitialized()
            await web3wallet.engine.signClient.engine.isValidApprove(params)
            const { id, relayProtocol, namespaces, sessionProperties } = params
            const proposal = web3wallet.engine.signClient.engine.client.proposal.get(id)
            let { pairingTopic, proposer, requiredNamespaces, optionalNamespaces } = proposal
            pairingTopic = pairingTopic || ''
            if (!isValidObject(requiredNamespaces)) {
                requiredNamespaces = getRequiredNamespacesFromNamespaces(namespaces, 'approve()')
            }

            const selfPublicKey = await web3wallet.engine.signClient.engine.client.core.crypto.generateKeyPair()
            const peerPublicKey = proposer.publicKey
            const sessionTopic = await web3wallet.engine.signClient.engine.client.core.crypto.generateSharedKey(
                selfPublicKey,
                peerPublicKey
            )

            if (pairingTopic && id) {
                await web3wallet.engine.signClient.engine.client.core.pairing.updateMetadata({
                    topic: pairingTopic,
                    metadata: proposer.metadata
                })
                await web3wallet.engine.signClient.engine.sendResult(id, pairingTopic, {
                    relay: {
                        protocol: relayProtocol ?? 'irn'
                    },
                    responderPublicKey: selfPublicKey
                })
                await web3wallet.engine.signClient.engine.client.proposal.delete(id, getSdkError('USER_DISCONNECTED'))
                await web3wallet.engine.signClient.engine.client.core.pairing.activate({ topic: pairingTopic })
            }

            // actually THATS THE FIX!
            const SESSION_EXPIRY = new Date().getTime() + 604800000
            const sessionSettle = {
                relay: { protocol: relayProtocol ?? 'irn' },
                namespaces,
                requiredNamespaces,
                optionalNamespaces,
                pairingTopic,
                controller: {
                    publicKey: selfPublicKey,
                    metadata: web3wallet.engine.signClient.engine.client.metadata
                },
                expiry: SESSION_EXPIRY,
                ...(sessionProperties && { sessionProperties })
            }
            await web3wallet.engine.signClient.engine.client.core.relayer.subscribe(sessionTopic)
            await web3wallet.engine.signClient.engine.sendRequest(sessionTopic, 'wc_sessionSettle', sessionSettle)
            const session = {
                ...sessionSettle,
                topic: sessionTopic,
                pairingTopic,
                acknowledged: false,
                self: sessionSettle.controller,
                peer: {
                    publicKey: proposer.publicKey,
                    metadata: proposer.metadata
                },
                controller: selfPublicKey
            }
            await web3wallet.engine.signClient.engine.client.session.set(sessionTopic, session)
            await web3wallet.engine.signClient.engine.setExpiry(sessionTopic, SESSION_EXPIRY)
            return {
                topic: sessionTopic,
                acknowledged: () =>
                    new Promise((resolve) =>
                        setTimeout(() => resolve(web3wallet.engine.signClient.engine.client.session.get(sessionTopic)), 500)
                    ) // artificial delay to allow for the session to be processed by the peer
            }
        } catch (e) {
            Log.log(`web3wallet.engine.signClient.engine.approve error ` + e.message)
        }
    }

    web3wallet.engine.approveSession = async (sessionProposal) => {
        let tmp, res
        try {
            tmp = await web3wallet.engine.signClient.approve({
                id: sessionProposal.id,
                namespaces: sessionProposal.namespaces
            })
        } catch (e) {
            Log.log(`web3wallet.engine.approveSession error 1 ` + e.message)
            throw new Error(e.message)
        }
        try {
            await tmp.acknowledged()
        } catch (e) {
            Log.log(`web3wallet.engine.approveSession error 2 ` + e.message)
            throw new Error(e.message)
        }
        try {
            res = web3wallet.engine.signClient.session.get(tmp.topic)
        } catch (e) {
            Log.log(`web3wallet.engine.approveSession error 3 ` + e.message)
            throw new Error(e.message)
        }
        return res
    }

    return web3wallet
}