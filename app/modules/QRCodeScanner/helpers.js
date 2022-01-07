/**
 * @version 0.45
 */
import _ from 'lodash'
import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import Log from '@app/services/Log/Log'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { decodeTransactionQrCode } from '@app/services/UI/Qr/QrScan'

import store from '@app/store'

import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'
import { QRCodeScannerFlowTypes } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { setWalletConnectData } from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'


export const finishProcess = async (param, qrCodeScannerConfig) => {
    if (
        param.data.indexOf('trusteenft:') === 0
    ) {
        NavStore.goNext('NftDetailedInfoQRCheck', { jsonData: param.data.substring(11) })
        return
    }

    const { currencyCode, flowType, callback } = qrCodeScannerConfig

    if (flowType === QRCodeScannerFlowTypes.ADD_MNEMONIC_SCANNER) {
        if (callback) {
            await callback(param.data)
        } else {
            NavStore.goBack()
        }
        return
    }


    if (flowType === QRCodeScannerFlowTypes.CASHBACK_LINK || (
        flowType === QRCodeScannerFlowTypes.MAIN_SCANNER &&
        (
            param.data.indexOf('https://trusteeglobal.com/link/') === 0
            || param.data.indexOf('https://trustee.deals/link/') === 0
        )
    )) {
        let link = param.data
        link = link.split('/')
        link = link[link.length - 1]
        await Log.log('QRCodeScanner.onSuccess ' + flowType + ' link ' + link + ' from ' + param.data)
        const qrData = {
            isCashbackLink: true,
            qrCashbackLink: link
        }
        if (callback) {
            await callback(qrData)
        } else {
            NavStore.goNext('CashbackScreen', { qrData })
        }
        return
    }


    const res = await decodeTransactionQrCode(param, currencyCode)

    if (typeof res.data.isWalletConnect !== 'undefined' && res.data.isWalletConnect) {
        if (flowType === QRCodeScannerFlowTypes.WALLET_CONNECT_SCANNER && callback) {
            NavStore.goBack()
            setTimeout(() => {
                callback(res.data.walletConnect)
            }, 500)
        } else {
            NavStore.goBack()
            setTimeout(() => {
                setWalletConnectData(res.data.walletConnect.fullLink)
                NavStore.goNext('WalletConnectScreen')
            }, 100)
        }
    } else if (flowType === QRCodeScannerFlowTypes.ADD_CUSTOM_TOKEN_SCANNER) {
        if (callback) {
            await callback(res.data.address || res.data.parsedUrl)
        } else {
            throw new Error('QRScanner Callback is required')
        }
    } else if (flowType === QRCodeScannerFlowTypes.SEND_SCANNER) {
        if (res.status === 'success' && typeof res.data.currencyCode !== 'undefined' && res.data.currencyCode && res.data.currencyCode !== currencyCode) {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.qrScanner.error.title'),
                description: strings('modal.qrScanner.error.description')
            }, () => {
                try {
                    this.scanner.reactivate()
                } catch {
                }
            })
        } else {
            let parsed
            if (res.status === 'success' && res.data.currencyCode === currencyCode) {
                parsed = res.data
                parsed.currencyCode = currencyCode
            } else {
                parsed = {
                    address: res.data.parsedUrl
                }
            }
            const newValue = {}
            if (typeof parsed.address !== 'undefined') {
                newValue.addressTo = parsed.address
            }
            if (typeof parsed.amount !== 'undefined' && parsed.amount && parsed.amount * 1 > 0) {
                newValue.cryptoValue = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(parsed.amount)
                newValue.isTransferAll = false
            }
            if (typeof parsed.label !== 'undefined' && parsed.label && parsed.label !== '') {
                newValue.memo = parsed.label
            }
            Log.log('QRCodeScanner.onSuccess from ' + flowType + ' parsed ' + JSON.stringify(parsed))
            SendActionsUpdateValues.setStepOne(newValue)
            if (callback) {
                await callback(newValue)
            } else {
                throw new Error('QRScanner Callback is required')
            }
        }
    } else if (flowType === QRCodeScannerFlowTypes.MAIN_SCANNER) {
        const { cryptoCurrencies } = store.getState().currencyStore

        let cryptoCurrency
        if (typeof res.data.currencyCode !== 'undefined' && res.data.currencyCode) {
            try {
                cryptoCurrency = _.find(cryptoCurrencies, { currencyCode: res.data.currencyCode })
            } catch (e) {
                e.message += ' on _.find by cryptoCurrencies '
                throw e
            }
        }

        if (res.status !== 'success') {
            const tmp = res.data.parsedUrl || res.data.address
            copyToClipboard(tmp)

            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.qrScanner.success.title'),
                description: strings('modal.qrScanner.success.description') + ' ' + tmp
            }, () => {
                NavStore.goBack(null)
            })
            return
        }

        if (typeof cryptoCurrency === 'undefined') {
            showModal({
                type: 'YES_NO_MODAL',
                icon: 'WARNING',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.tokenNotAdded.description', { currencyCode: res.data.currencyCode }),
                reverse: true,
                noCallback: () => {
                    NavStore.goNext('AddAssetScreen', { currencyCode: [res.data.currencyCode] })
                }
            }, () => {
                try {
                    this.scanner.reactivate()
                } catch {
                }
            })
            return
        }

        if (+cryptoCurrency.isHidden) {
            showModal({
                type: 'YES_NO_MODAL',
                icon: 'WARNING',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.tokenHidden.description', { currencyName: cryptoCurrency.currencyName }),
                reverse: true,
                noCallback: () => {
                    NavStore.goNext('AddAssetScreen', { currencyCode: [cryptoCurrency.currencyCode] })
                }
            }, () => {
                try {
                    this.scanner.reactivate()
                } catch {
                }
            })
            return
        }

        const parsed = res.data
        parsed.currencyCode = cryptoCurrency.currencyCode
        await SendActionsStart.startFromQRCodeScanner(parsed, 'MAIN_SCANNER')
    }
}
