/**
 * @version 1.0
 */
import store from '@app/store'

import Log from '@app/services/Log/Log'

import walletConnectService from '@app/appstores/Stores/WalletConnect/WalletConnectService'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import config from '@app/config/config'
import { setWalletDapp } from '@app/appstores/Stores/WalletDapp/WalletDappStoreActions'

const { dispatch } = store

const walletConnectActions = {

    resetWalletConnect: () => {
        trusteeAsyncStorage.setWalletConnectLink('')
        return dispatch({
            type: 'SET_WALLET_CONNECT',
            walletConnectLink: false,
            walletConnectLinkError: false,
            walletConnector: false,
            walletConnections: [],
            isConnected: false,
            linkSource: false,
        })
    },

    initWalletConnect: async () => {
        const walletConnectLink = trusteeAsyncStorage.getWalletConnectLink()
        const dappData = trusteeAsyncStorage.getWalletConnectDapp()
        if (!walletConnectLink) {
            Log.log('WalletConnect.initWalletConnect link NONE')
        } else if (dappData) {
            Log.log('WalletConnect.initWalletConnect link ' + walletConnectLink + ' dapp ' + JSON.stringify(dappData))
            await walletConnectActions.connectAndSetWalletConnectLink(walletConnectLink, 'SAVED', true, dappData)
        } else {
            Log.log('WalletConnect.initWalletConnect link ' + walletConnectLink)
            await walletConnectActions.connectAndSetWalletConnectLink(walletConnectLink, 'SAVED', true)
        }
        return false
    },

    connectAndSetWalletConnectLink: async (walletConnectLink, linkSource, activatePairing = false, dappData = false) => {
        if (dappData && store.getState().walletDappStore.dapp !== dappData) {
            trusteeAsyncStorage.setWalletConnectDapp(dappData)
            setWalletDapp(dappData)
        } else {
            const oldData = store.getState().walletConnectStore.walletConnectLink
            if (oldData === walletConnectLink || !walletConnectLink) {
                return false
            }
        }

        try {
            const walletConnector = await walletConnectService.createAndConnect(walletConnectLink, activatePairing)
            trusteeAsyncStorage.setWalletConnectLink(walletConnectLink)
            dispatch({
                type: 'SET_WALLET_CONNECT',
                walletConnectLink: walletConnectLink,
                walletConnectLinkError: false,
                walletConnector,
                walletConnections: store.getState().walletConnectStore.walletConnections,
                isConnected: true,
                linkSource,
            })
            walletConnectActions.getAndSetWalletConnections(walletConnector)
            return true
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletConnect.connectAndSetWalletConnectLink error ' + e.message + ' ' + walletConnectLink)
            }
            Log.log('WalletConnect.connectAndSetWalletConnectLink error ' + e.message + ' ' + walletConnectLink)
            dispatch({
                type: 'SET_WALLET_CONNECT',
                walletConnectLink: walletConnectLink,
                walletConnectLinkError: e.message + ' link ' + walletConnectLink,
                walletConnector: false,
                walletConnections: [],
                isConnected: false,
                linkSource: false,
            })
            return false
        }
    },

    getAndSetWalletConnections: async (walletConnector) => {
        try {
            const connections = await walletConnectService.getConnections(walletConnector)
            dispatch({
                type: 'SET_WALLET_CONNECTIONS',
                walletConnections: connections,
                isConnected: connections.length > 0 ? true : false
            })
        } catch (e) {
            console.log('WalletConnect.getAndSetWalletConnections error ' + e.message)
        }
    },

    approveRequest: async (payload, transactionHash) => {
        try {
            const walletConnector = store.getState().walletConnectStore.walletConnector
            await walletConnectService.approveRequest(walletConnector, payload, transactionHash)
        } catch (e) {
            console.log('WalletConnect.approveRequest error ' + e.message)
        }
    },

    rejectRequest: async (payload) => {
        try {
            const walletConnector = store.getState().walletConnectStore.walletConnector
            await walletConnectService.rejectRequest(walletConnector, payload)
        } catch (e) {
            console.log('WalletConnect.rejectRequest error ' + e.message)
        }
    },

    disconnectAndSetWalletConnectLink: async () => {
        try {
            const walletConnector = store.getState().walletConnectStore.walletConnector
            const connections = await walletConnectService.killConnections(walletConnector)
            if (connections && connections.length > 0) {
                dispatch({
                    type: 'SET_WALLET_CONNECTIONS',
                    walletConnections: connections,
                    isConnected: true
                })
            } else {
                trusteeAsyncStorage.setWalletConnectLink('')
                trusteeAsyncStorage.setWalletConnectDapp('')
                dispatch({
                    type: 'SET_WALLET_CONNECT',
                    walletConnectLink: false,
                    walletConnectLinkError: false,
                    walletConnector: false,
                    walletConnections: [],
                    isConnected: false,
                    linkSource: false,
                })
            }
        } catch (e) {
            console.log('WalletConnect.disconnectAndSetWalletConnectLink error ' + e.message)
        }
    }
}

export default walletConnectActions
