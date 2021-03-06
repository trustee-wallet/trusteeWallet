/**
 * @version 0.41
 */
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'

import store from '@app/store'
const { dispatch } = store

const CACHE_DATA = {
    countedFeesData : {} as BlocksoftBlockchainTypes.TransferData,
    countedFees : {}
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
            amount : '?',
            accountBalanceRaw : account.balanceRaw,
            isTransferAll: false,
            useOnlyConfirmed: !(walletUseUnconfirmed === 1),
            allowReplaceByFee: walletAllowReplaceByFee === 1,
            useLegacy: walletUseLegacy,
            isHd: walletIsHd,
            accountJson
        } as BlocksoftBlockchainTypes.TransferData

        /*const countedFees = await BlocksoftTransfer.getTransferAllBalance(countedFeesData)
        let selectedFee = false
        if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
            // @ts-ignore
            selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
        }
        return { transferBalance: countedFees.selectedTransferAllBalance }
        */
    }

    export const getTransferAllBalance = async () => {
        CACHE_DATA.countedFeesData.amount = CACHE_DATA.countedFeesData.transferAllBalance
        CACHE_DATA.countedFeesData.isTransferAll = true
        const countedFees = await BlocksoftTransfer.getTransferAllBalance(CACHE_DATA.countedFeesData)
        let selectedFee = false
        if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
            // @ts-ignore
            selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
        }
        const transferAllBalance = countedFees.selectedTransferAllBalance
        dispatch({
            type: 'SET_DATA_BLOCKCHAIN',
            fromBlockchain : {
                selectedFee,
                transferAllBalance
            }
        })
    }
}
