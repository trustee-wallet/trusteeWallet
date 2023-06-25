/**
 * @version 1.0
 */
import store from '@app/store'

import Log from '@app/services/Log/Log'

import { Web3Injected } from '@crypto/services/Web3Injected'
import walletConnectService from '@app/appstores/Stores/WalletConnect/WalletConnectService'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import { setWalletDapp } from '@app/appstores/Stores/WalletDapp/WalletDappStoreActions'

const { dispatch } = store

const walletConnectActions = {

    setIsConnectedWalletConnect: ({ isConnected, peerId, peerMeta }) => {
        const oldData = store.getState().walletConnectStore.isConnected
        const oldPeerId = store.getState().walletConnectStore.peerId
        const oldPeerMeta = store.getState().walletConnectStore.peerMeta
        if (oldData === isConnected && (!peerId || peerId === oldPeerId) && (!peerMeta || peerMeta === oldPeerMeta)) {
            return false
        }
        return dispatch({
            type: 'SET_WALLET_CONNECT_IS_CONNECTED',
            isConnected,
            peerId: peerId || oldPeerId,
            peerMeta: peerMeta || oldPeerMeta
        })
    },

    resetWalletConnect: () => {
        trusteeAsyncStorage.setWalletConnectLink('')
        return dispatch({
            type: 'SET_WALLET_CONNECT',
            walletConnectLink: false,
            walletConnectLinkError: false,
            walletConnector: false,
            isConnected: false,
            linkSource: false,
        })
    },

    initWalletConnect: async () => {
        const walletConnectLink = trusteeAsyncStorage.getWalletConnectLink()
        if (!walletConnectLink) return false
        Log.log('WalletConnect.initWalletConnect link ' + walletConnectLink)
        const { session, dappData } = trusteeAsyncStorage.getWalletConnectSession()
        await walletConnectActions.connectAndSetWalletConnectLink(walletConnectLink, dappData ? 'DAPP_SAVED' : 'SAVED', session)

        const walletConnector = store.getState().walletConnectStore.walletConnector
        walletConnectActions.setIsConnectedWalletConnect({
            isConnected : walletConnector.connected,
            peerId : walletConnector?.peerId,
            peerMeta: walletConnector?.peerMeta
        })
        setWalletDapp(dappData)
        walletConnectActions.getAndSetWalletConnectAccount(walletConnector, walletConnector.chainId)
    },

    connectAndSetWalletConnectLink: async (walletConnectLink, linkSource, session, dappData) => {
        const oldData = store.getState().walletConnectStore.walletConnectLink
        if (oldData === walletConnectLink || !walletConnectLink) {
            return false
        }

        try {
            const walletConnector = await walletConnectService.createAndConnect(walletConnectLink, session, dappData)
            trusteeAsyncStorage.setWalletConnectLink(walletConnectLink)
            dispatch({
                type: 'SET_WALLET_CONNECT',
                walletConnectLink: walletConnectLink,
                walletConnectLinkError: false,
                walletConnector,
                isConnected: walletConnector && walletConnector?.connected || false,
                linkSource,
            })
            return true
        } catch (e) {
            Log.log('WalletConnect.connectAndSetWalletConnectLink error ' + e.message + ' ' + walletConnectLink + ' session ' + JSON.stringify(session))
            dispatch({
                type: 'SET_WALLET_CONNECT',
                walletConnectLink: walletConnectLink,
                walletConnectLinkError: e.message + ' link ' + walletConnectLink,
                walletConnector: false,
                isConnected: false,
                linkSource: false,
            })
            return false
        }
    },

    rejectRequestWalletConnect : async (payload) => {
        const walletConnector = store.getState().walletConnectStore.walletConnector
        if (!walletConnector) {
            return false
        }
        await walletConnectService.rejectRequest(walletConnector, payload)
    },

    approveRequestWalletConnect: async (payload, txHash) => {
        const walletConnector = store.getState().walletConnectStore.walletConnector
        if (!walletConnector) {
            return false
        }
        await walletConnectService.approveRequest(walletConnector, payload, txHash)
    },


    disconnectAndSetWalletConnectLink: async () => {
        const walletConnector = store.getState().walletConnectStore.walletConnector
        if (!walletConnector) {
            return false
        }
        await walletConnectService.killSession(walletConnector)
    },

    getAndSetWalletConnectAccountNetwork: async (_walletConnector = false, chainId = 0, source = '_') => {
        let walletConnector = _walletConnector
        if (!walletConnector) {
            walletConnector = store.getState().walletConnectStore.walletConnector
        }
        if (!walletConnector) {
            return false
        }

        Log.log('WalletConnect.getAndSetWalletConnectAccountNetwork chainId ' + chainId + ' source ' + source)
        try {
            await walletConnectService.updateSession(walletConnector, { chainId })
        } catch (e) {
            Log.log('WalletConnect.getAndSetWalletConnectAccountNetwork chainId ' + chainId + ' updateSession error ' + e.message)
        }
    },

    getAndSetWalletConnectAccount: (payload) => {
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
                accounts.push(`${chain}:${currentETHAddress.address}`)
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
}

export default walletConnectActions
