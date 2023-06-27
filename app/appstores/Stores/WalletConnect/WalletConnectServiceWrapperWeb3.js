/**
 * @version 1.0
 */
import Log from '@app/services/Log/Log'
import { getRequiredNamespacesFromNamespaces, getSdkError, isValidObject } from '@walletconnect/utils'

export default (web3wallet) => {
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