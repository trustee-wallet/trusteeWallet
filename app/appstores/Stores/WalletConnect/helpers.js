/**
 * @version 2.0
 */
import store from '@app/store'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'
import NavStore from '@app/components/navigation/NavStore'

import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'

import { NETWORKS_SETTINGS } from '@app/appstores/Stores/WalletConnect/settings'
import walletConnectService from '@app/appstores/Stores/WalletConnect/WalletConnectService'
import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'

export function handleSessionProposalModal(walletConnector, data) {
    let title = '?'
    try {
        title = data.params?.proposer?.metadata?.name + ' ' + data.params?.proposer?.metadata?.url
    } catch (e) {
        Log.err('WalletConnectService.handleSessionProposal v2 title error ' + e.message)
    }
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.session'),
        description: strings('settings.walletConnect.sessionText') + title,
        reverse: true,
        noCallback: async () => {
            await walletConnectService.rejectSession(walletConnector, data)
            const { initSource } = store.getState().walletConnectStore
            if (initSource === 'QR') {
                Log.log('WalletConnectService.handleSessionProposal v2 NO initSource=' + initSource + ' navStore.goBack started')
                NavStore.goBack()
            } else {
                Log.log('WalletConnectService.handleSessionProposal v2 NO initSource=' + initSource + ' navStore.goBack skipped')
            }
        }
    }, async () => {
        await walletConnectService.approveSession(walletConnector, data)
        walletConnectActions.getAndSetWalletConnections(walletConnector)
    })
}


export async function handleSendTransactionRedirect(walletConnector, data, accountCurrencyCode, payload) {
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
        walletConnectPayload: payload,
        transactionFilterType : TransactionFilterTypeDict.WALLET_CONNECT
    })
}
export function handleSignTransactionModal(walletConnector, chainId, data, accountCurrencyCode, payload) {

    const dataCopy = {...data}
    if (typeof dataCopy.from !== 'undefined') {
        delete dataCopy.from
    }
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.sign') + ' ' + data.from + ' ' + accountCurrencyCode,
        description: strings('settings.walletConnect.signTransaction') + ' ' + JSON.stringify(dataCopy),
        noCallback: async () => {
            walletConnectService.rejectRequest(walletConnector, payload)
        }
    }, async () => {
        await walletConnectService.approveSignTransaction(walletConnector, chainId, data.from, data, accountCurrencyCode, payload)
    })
}

export function handleSendSignModal(walletConnector, chainId, from, message, payload) {
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.sign') + ' ' + from,
        description: strings('settings.walletConnect.signText') + ' ' + message,
        noCallback: async () => {
            walletConnectService.rejectRequest(walletConnector, payload)
        }
    }, async () => {
        await walletConnectService.approveSign(walletConnector, chainId, from, message, payload)
    })
}


export function handleSendSignTypedModal(walletConnector, chainId, from, data, payload) {
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.signTyped') + ' ' + from,
        description: strings('settings.walletConnect.signTypedText') + ' ' + JSON.stringify(data).substr(0, 200),
        noCallback: async () => {
            walletConnectService.rejectRequest(walletConnector, payload)
        }
    }, async () => {
        await walletConnectService.approveSignTyped(walletConnector, chainId, from, data, payload)
    })
}