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
import NavStore from '@app/components/navigation/NavStore'

import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import EthNetworkPrices from '@crypto/blockchains/eth/basic/EthNetworkPrices'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

const { dispatch } = store

const CACHE_DATA = {
    countedFeesData: {} as BlocksoftBlockchainTypes.TransferData,
    transferAllBalance: '0',
    additionalData : false as any
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
            accountJson,
            transactionJson: {}
        } as BlocksoftBlockchainTypes.TransferData

        if (typeof additional.tbk !== 'undefined' && additional.tbk && additional.tbk.transactionAction) {
            if (additional.tbk.transactionAction === 'transactionSpeedUp') {
                newCountedFeesData.transactionSpeedUp = additional.tbk.transactionBoost.transactionHash
            } else if (additional.tbk.transactionAction === 'transactionReplaceByFee') {
                newCountedFeesData.transactionReplaceByFee = additional.tbk.transactionBoost.transactionHash
            } else if (additional.tbk.transactionAction === 'transactionRemoveByFee') {
                newCountedFeesData.transactionReplaceByFee = additional.tbk.transactionBoost.transactionHash
            } else {
                throw new Error('undefined SendActionsBlockchainWrapper beforeRender transactionAction ' + additional.tbk.transactionAction)
            }
            if (typeof additional.tbk.transactionBoost.transactionJson !== 'undefined' && additional.tbk.transactionBoost.transactionJson) {
                newCountedFeesData.transactionJson = additional.tbk.transactionBoost.transactionJson
            }
        }

        CACHE_DATA.additionalData = false
        if (JSON.stringify(CACHE_DATA.countedFeesData) === JSON.stringify(newCountedFeesData)) {
            return
        }
        if (newCountedFeesData.addressFrom !== CACHE_DATA.countedFeesData.addressFrom) {
            CACHE_DATA.transferAllBalance = '0'
        }
        CACHE_DATA.countedFeesData = newCountedFeesData

    }

    export const getCustomFeeRate = async (newFee : any) => {
        let newCountedFeesData = {}
        try {
            newCountedFeesData = { ...CACHE_DATA.countedFeesData }
            const countedFees = await BlocksoftTransfer.getFeeRate(newCountedFeesData,
                CACHE_DATA.additionalData ? {...newFee, ... CACHE_DATA.additionalData} : newFee )
            let selectedFee = false
            if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
                // @ts-ignore
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            }
            return selectedFee
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendActionsBlockchainWrapper.getCustomFeeRate error ' + e.message)
            }
            if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                const extend = BlocksoftDict.getCurrencyAllSettings(newCountedFeesData?.currencyCode)
                Log.errorTranslate(e, 'SendActionsBlockchainWrapper.getCustomFeeRate', extend)
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                })
            } else {
                Log.err('SendActionsBlockchainWrapper.getCustomFeeRate error ' + e.message)
            }
        }
    }

    export const getFeeRate = async (uiData = {}, precountedSelectedFee = false) => {
        let newCountedFeesData = {}
        try {
            if (typeof uiData === 'undefined' || typeof uiData.addressTo === 'undefined') {
                uiData = store.getState().sendScreenStore.ui
            }

            const forceExecAmount = typeof uiData.bse !== 'undefined' && typeof uiData.bse.forceExecAmount !== 'undefined' && uiData.bse.forceExecAmount

            newCountedFeesData = { ...CACHE_DATA.countedFeesData }
            newCountedFeesData.addressTo = uiData.addressTo
            newCountedFeesData.amount = uiData.cryptoValue
            newCountedFeesData.memo = uiData.memo
            newCountedFeesData.isTransferAll = uiData.isTransferAll

            if (newCountedFeesData.isTransferAll && !forceExecAmount) {
                newCountedFeesData.amount = newCountedFeesData.accountBalanceRaw
            }
            if (typeof uiData.contractCallData !== 'undefined') {
                newCountedFeesData.contractCallData = uiData.contractCallData
            }
            if (typeof uiData.walletConnectData !== 'undefined') {
                newCountedFeesData.walletConnectData = uiData.walletConnectData
            }
            if (typeof uiData.dexOrderData !== 'undefined') {
                if (uiData.dexOrderData || newCountedFeesData.dexOrderData) {
                    newCountedFeesData.dexOrderData = uiData.dexOrderData
                }
            }
            if (!store.getState().sendScreenStore.fromBlockchain.neverCounted) {
                if (JSON.stringify(CACHE_DATA.countedFeesData) === JSON.stringify(newCountedFeesData)) {
                    return { isTransferAll : newCountedFeesData.isTransferAll, amount : newCountedFeesData.amount, source : 'CACHE_COUNTED', addressTo : newCountedFeesData.addressTo}
                }
            }
            if (config.debug.sendLogs) {
                console.log('SendActionsBlockchainWrapper.getFeeRate starting')
            }
            let countedFees
            if (precountedSelectedFee) {
                Log.log('SendActionsBlockchainWrapper.getFeeRate has precountedSelectedFee ', precountedSelectedFee)
                countedFees = {
                    fees: [precountedSelectedFee],
                    selectedFeeIndex: 0
                }
            } else {
                try {
                    countedFees = await BlocksoftTransfer.getFeeRate(newCountedFeesData, CACHE_DATA.additionalData ? CACHE_DATA.additionalData : {})
                } catch (e) {
                    if (e.message.indexOf('SERVER') === -1) {
                        e.message += ' while BlocksoftTransfer.getFeeRate'
                    }
                    throw e
                }
            }

            if (forceExecAmount && typeof countedFees !== 'undefined' && countedFees && typeof countedFees.fees !== 'undefined' && countedFees.fees) {
                for (let i = 0; i< countedFees.fees.length; i++ ) {
                    if (typeof countedFees.fees[i].amountForTx !== 'undefined') {
                        countedFees.fees[i].amountForTx = uiData.cryptoValue
                    }
                }
                if (typeof countedFees.amountForTx !== 'undefined') {
                    countedFees.amountForTx = uiData.cryptoValue
                }
            }

            let selectedFee = false
            if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
                // @ts-ignore
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            }
            if (typeof countedFees.additionalData !== 'undefined' && countedFees.additionalData) {
                CACHE_DATA.additionalData = countedFees.additionalData
            }
            CACHE_DATA.countedFeesData = newCountedFeesData

            dispatch({
                type: 'RESET_DATA_BLOCKCHAIN',
                fromBlockchain: {
                    countedFees,
                    selectedFee,
                    neverCounted : false
                }
            })

            return { isTransferAll : newCountedFeesData.isTransferAll, amount : newCountedFeesData.amount, source : 'NEW_COUNTED', addressTo : newCountedFeesData.addressTo}

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendActionsBlockchainWrapper.getFeeRate error ' + e.message, e)
            }
            if (typeof e.message === 'undefined' ) {
                Log.log('SendActionsBlockchainWrapper.getFeeRate strange error')
            } else if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                const extend = BlocksoftDict.getCurrencyAllSettings(newCountedFeesData?.currencyCode)
                Log.errorTranslate(e, 'SendActionsBlockchainWrapper.getFeeRate', extend)
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                })
            } else {
                Log.log('SendActionsBlockchainWrapper.getFeeRate inner error ' + e.message)
            }
        }

        return {source : 'ERROR', addressTo : '?'}
    }

    export const getTransferAllBalance = async (uiData = {}) => {
        const newCountedFeesData = { ...CACHE_DATA.countedFeesData }
        try {
            if (typeof uiData === 'undefined' || typeof uiData.addressTo === 'undefined') {
                uiData = store.getState().sendScreenStore.ui
            }
            newCountedFeesData.addressTo = uiData.addressTo
            newCountedFeesData.amount = newCountedFeesData.accountBalanceRaw
            newCountedFeesData.memo = uiData.memo
            newCountedFeesData.isTransferAll = uiData.isTransferAll
            if (!newCountedFeesData.addressTo || newCountedFeesData.addressTo === '' || newCountedFeesData.addressTo === '?') {
                newCountedFeesData.addressTo = BlocksoftTransferUtils.getAddressToForTransferAll({
                    currencyCode: newCountedFeesData.currencyCode,
                    address: newCountedFeesData.addressFrom
                })
            }
            if (!store.getState().sendScreenStore.fromBlockchain.neverCounted && JSON.stringify(CACHE_DATA.countedFeesData) === JSON.stringify(newCountedFeesData)) {
                return { transferAllBalance : CACHE_DATA.transferAllBalance, source : 'CACHE_COUNTED', addressTo : newCountedFeesData.addressTo}
            }
            const countedFees = await BlocksoftTransfer.getTransferAllBalance(newCountedFeesData, CACHE_DATA.additionalData ? CACHE_DATA.additionalData : {})
            let selectedFee = false
            if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
                // @ts-ignore
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            }
            if (typeof countedFees.additionalData !== 'undefined' && countedFees.additionalData) {
                CACHE_DATA.additionalData = countedFees.additionalData
            }
            const transferAllBalance = countedFees.selectedTransferAllBalance
            CACHE_DATA.countedFeesData = newCountedFeesData
            CACHE_DATA.transferAllBalance = transferAllBalance
            dispatch({
                type: 'RESET_DATA_BLOCKCHAIN',
                fromBlockchain: {
                    countedFees,
                    selectedFee,
                    transferAllBalance,
                    neverCounted : false
                }
            })
            return { transferAllBalance : typeof transferAllBalance !== 'undefined' && transferAllBalance ? transferAllBalance : 0, source : 'NEW_COUNTED', addressTo : newCountedFeesData.addressTo, selectedFee}
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendActionsBlockchainWrapper.getTransferAllBalance error ' + e.message)
            }
            if (typeof e.message === 'undefined' ) {
                Log.log('SendActionsBlockchainWrapper.getTransferAllBalance strange error')
            } else if (e.message.indexOf('SERVER_RESPONSE_') !== -1) {
                const extend = BlocksoftDict.getCurrencyAllSettings(newCountedFeesData?.currencyCode)
                Log.errorTranslate(e, 'SendActionsBlockchainWrapper.getTransferAllBalance ', extend)
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: e.message
                })
            } else {
                Log.log('SendActionsBlockchainWrapper.getTransferAllBalance inner error '  + e.message)
            }
        }
        return { transferAllBalance : 0, source : 'ERROR', addressTo : '?'}
    }

    export const actualSend = async (sendScreenStore : any, uiErrorConfirmed: any, selectedFee : any, newCryptoValue : any) => {
        const newCountedFeesData = { ...CACHE_DATA.countedFeesData }
        const { ui } = sendScreenStore
        const { bse, dexOrderData, rawOnly, contractCallData } = ui
        const { bseOrderId, bseMinCrypto } = bse

        const transactionFilterType = ui.transactionFilterType

        if (selectedFee === false) {
            selectedFee = {}
        }
        if (typeof bseOrderId !== 'undefined' && bseOrderId) {
            selectedFee.bseOrderId = bseOrderId
        }
        if (typeof bseMinCrypto !== 'undefined' && bseMinCrypto) {
            selectedFee.bseMinCrypto = bseMinCrypto
        }
        if (typeof dexOrderData !== 'undefined') {
            newCountedFeesData.dexOrderData = dexOrderData
        }
        if (typeof contractCallData !== 'undefined') {
            newCountedFeesData.contractCallData = contractCallData
        }

        newCountedFeesData.addressTo = ui.addressTo
        newCountedFeesData.amount = ui.cryptoValue
        if (typeof newCryptoValue !== 'undefined' && newCryptoValue) {
            newCountedFeesData.amount = newCryptoValue
        }
        newCountedFeesData.memo = ui.memo
        newCountedFeesData.isTransferAll = ui.isTransferAll

        selectedFee.rawOnly = rawOnly || false

        return BlocksoftTransfer.sendTx(newCountedFeesData, { uiErrorConfirmed, selectedFee, transactionFilterType }, CACHE_DATA.additionalData)
    }
}
