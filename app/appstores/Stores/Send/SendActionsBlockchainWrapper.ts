/**
 * @version 0.41
 */
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'

import store from '@app/store'
import config from '@app/config/config'
import Log from '@app/services/Log/Log'
import { BlocksoftTransferUtils } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

const { dispatch } = store

const CACHE_DATA = {
    countedFeesData: {} as BlocksoftBlockchainTypes.TransferData,
    transferAllBalance: '0'
}
export namespace SendActionsBlockchainWrapper {

    export const beforeRender = (cryptoCurrency: any, account: any, additional: any = {}) => {
        const { selectedWallet } = store.getState().mainStore
        const {
            walletHash,
            walletUseUnconfirmed,
            walletAllowReplaceByFee,
            walletUseLegacy,
            walletIsHd
        } = selectedWallet
        const { address, currencyCode, derivationPath, accountJson } = account


        const newCountedFeesData = {
            currencyCode: currencyCode,
            walletHash: walletHash,
            derivationPath: derivationPath,
            addressFrom: address,
            addressTo: additional.addressTo || '?',
            amount: additional.amount || account.balanceRaw,
            memo: additional.memo || null,
            accountBalanceRaw: account.balanceRaw,
            isTransferAll: false,
            useOnlyConfirmed: !(walletUseUnconfirmed === 1),
            allowReplaceByFee: walletAllowReplaceByFee === 1,
            useLegacy: walletUseLegacy,
            isHd: walletIsHd,
            accountJson
        } as BlocksoftBlockchainTypes.TransferData
        if (JSON.stringify(CACHE_DATA.countedFeesData) === JSON.stringify(newCountedFeesData)) {
            return
        }
        if (newCountedFeesData.addressFrom !== CACHE_DATA.countedFeesData.addressFrom) {
            CACHE_DATA.transferAllBalance = '0'
        }
        CACHE_DATA.countedFeesData = newCountedFeesData
    }

    export const getFeeRate = async (uiData = {}) => {
        try {
            if (typeof uiData === 'undefined' || typeof uiData.addressTo === 'undefined') {
                uiData = store.getState().sendScreenStore.ui
            }
            const newCountedFeesData = { ...CACHE_DATA.countedFeesData }
            newCountedFeesData.addressTo = uiData.addressTo
            newCountedFeesData.amount = uiData.cryptoValue
            newCountedFeesData.memo = uiData.memo
            if (JSON.stringify(CACHE_DATA.countedFeesData) === JSON.stringify(newCountedFeesData)) {
                return
            }
            const countedFees = await BlocksoftTransfer.getFeeRate(newCountedFeesData)
            let selectedFee = false
            if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
                // @ts-ignore
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            }
            CACHE_DATA.countedFeesData = newCountedFeesData

            dispatch({
                type: 'RESET_DATA_BLOCKCHAIN',
                fromBlockchain: {
                    countedFees,
                    selectedFee
                }
            })

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendActionsBlockchainWrapper.getFeeRate error ' + e.message)
            }
            if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('send.errors.' + e.message)
                })
            } else {
                Log.err('SendActionsBlockchainWrapper.getFeeRate error ' + e.message)
            }
        }
    }

    export const getTransferAllBalance = async () => {
        try {
            const { ui } = store.getState().sendScreenStore
            const newCountedFeesData = { ...CACHE_DATA.countedFeesData }
            newCountedFeesData.addressTo = ui.addressTo
            newCountedFeesData.memo = ui.memo
            if (!newCountedFeesData.addressTo || newCountedFeesData.addressTo === '' || newCountedFeesData.addressTo === '?') {
                newCountedFeesData.addressTo = BlocksoftTransferUtils.getAddressToForTransferAll({
                    currencyCode: newCountedFeesData.currencyCode,
                    address: newCountedFeesData.addressFrom
                })
            }
            newCountedFeesData.amount = newCountedFeesData.accountBalanceRaw
            if (JSON.stringify(CACHE_DATA.countedFeesData) === JSON.stringify(newCountedFeesData)) {
                return CACHE_DATA.transferAllBalance
            }
            const countedFees = await BlocksoftTransfer.getTransferAllBalance(newCountedFeesData)
            let selectedFee = false
            if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
                // @ts-ignore
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            }
            const transferAllBalance = countedFees.selectedTransferAllBalance
            CACHE_DATA.countedFeesData = newCountedFeesData
            CACHE_DATA.transferAllBalance = transferAllBalance
            dispatch({
                type: 'RESET_DATA_BLOCKCHAIN',
                fromBlockchain: {
                    countedFees,
                    selectedFee,
                    transferAllBalance
                }
            })
            return typeof transferAllBalance !== 'undefined' && transferAllBalance ? transferAllBalance : 0
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendActionsBlockchainWrapper.getTransferAllBalance error ' + e.message)
            }
            if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('send.errors.' + e.message)
                })
            } else {
                Log.err('SendActionsBlockchainWrapper.getTransferAllBalance error ' + e.message)
            }
        }
        return '0'
    }

    export const actualSend = async (uiErrorConfirmed: any, selectedFee : any) => {
        const newCountedFeesData = { ...CACHE_DATA.countedFeesData }
        // @ts-ignore
        return await BlocksoftTransfer.sendTx(newCountedFeesData, { uiErrorConfirmed, selectedFee })
    }
}
