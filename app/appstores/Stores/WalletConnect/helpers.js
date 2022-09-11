/**
 * @version 1.0
 */
import store from '@app/store'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'
import NavStore from '@app/components/navigation/NavStore'

import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'

import walletConnectService from '@app/appstores/Stores/WalletConnect/WalletConnectService'
import { NETWORKS_SETTINGS } from '@app/appstores/Stores/WalletConnect/settings'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'


export function handleSessionRequestModal(walletConnector, data, dappData) {
    let title = '?'
    try {
        title = data.peerMeta.name + ' ' + data.peerMeta.url
    } catch (e) {
        Log.err('WalletConnectService.handleSessionRequest title error ' + e.message)
    }
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.session'),
        description: strings('settings.walletConnect.sessionText') + title,
        noCallback: async () => {
            await walletConnectService.rejectSession(walletConnector)
            const { initSource } = store.getState().walletConnectStore
            if (initSource === 'QR') {
                Log.log('WalletConnectService.handleSessionRequest NO initSource=' + initSource + ' navStore.goBack started')
                NavStore.goBack()
            } else {
                Log.log('WalletConnectService.handleSessionRequest NO initSource=' + initSource + ' navStore.goBack skipped')
            }
        }
    }, async () => {
        await walletConnectService.approveSession(walletConnector, data, dappData)
    })
}


export async function handleSendTransactionRedirect(walletConnector, data, payload) {
    const { accountCurrencyCode } = store.getState().walletConnectStore
    const { cryptoCurrencies } = store.getState().currencyStore
    let found = false
    for (const cryptoCurrency of cryptoCurrencies) {
        if (cryptoCurrency.currencyCode === accountCurrencyCode) {
            found = true
            continue
        }
    }
    if (!found) {
        let title = accountCurrencyCode
        for (const tmp of NETWORKS_SETTINGS) {
            if (tmp.currencyCode === accountCurrencyCode) {
                title = tmp.networkTitle
            }
        }
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('modal.exchange.sorry'),
            description: strings('settings.walletConnect.turnBasicAsset', {asset : title}),
        }, () => {
            NavStore.goNext('AddAssetScreen')
        })
        return false
    }
    await SendActionsStart.startFromWalletConnect({
        currencyCode: accountCurrencyCode,
        walletConnectData: data,
        walletConnectPayload : payload,
        transactionFilterType : TransactionFilterTypeDict.WALLET_CONNECT
    })
}

export function handleSendSignModal(walletConnector, message, payload) {
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.sign'),
        description: strings('settings.walletConnect.signText') + message,
        noCallback: async () => {
            await walletConnectService.rejectRequest(walletConnector, payload)
        }
    }, async () => {
        await walletConnectService.approveSign(walletConnector, message, payload)
    })
}


export function handleSendSignTypedModal(walletConnector, data, payload) {
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.signTyped'),
        description: strings('settings.walletConnect.signTypedText') + JSON.stringify(data).substr(0, 200),
        noCallback: async () => {
            await walletConnectService.rejectRequest(walletConnector, payload)
        }
    }, async () => {
        await walletConnectService.approveSignTyped(walletConnector, data, payload)
    })
}