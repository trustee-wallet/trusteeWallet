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
    countedFeesData : {} as BlocksoftBlockchainTypes.TransferData,
    countedFees : {},
    transferAllBalance : '0'
}
export namespace SendActionsBlockchainWrapper {

    export const beforeRender = (cryptoCurrency : any, account : any) => {
        const { selectedWallet } = store.getState().mainStore
        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee, walletUseLegacy, walletIsHd } = selectedWallet
        const { address, currencyCode, derivationPath, accountJson } = account


        CACHE_DATA.countedFeesData = {
            currencyCode: currencyCode,
            walletHash: walletHash,
            derivationPath: derivationPath,
            addressFrom: address,
            addressTo: '?',
            amount : account.balanceRaw,
            accountBalanceRaw : account.balanceRaw,
            isTransferAll: false,
            useOnlyConfirmed: !(walletUseUnconfirmed === 1),
            allowReplaceByFee: walletAllowReplaceByFee === 1,
            useLegacy: walletUseLegacy,
            isHd: walletIsHd,
            accountJson
        } as BlocksoftBlockchainTypes.TransferData
    }

    export const getTransferAllBalance = async () => {
        try {
            const newCountedFeesData = {... CACHE_DATA.countedFeesData}
            if (newCountedFeesData.addressTo === '?') {
                newCountedFeesData.addressTo =  BlocksoftTransferUtils.getAddressToForTransferAll({
                    currencyCode : newCountedFeesData.currencyCode,
                    address : newCountedFeesData.addressFrom
                })
            }
            newCountedFeesData.amount = newCountedFeesData.accountBalanceRaw
            if (CACHE_DATA.countedFeesData === newCountedFeesData) {
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
                type: 'SET_DATA_BLOCKCHAIN',
                fromBlockchain: {
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
}
