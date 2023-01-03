/**
 * @version 0.41
 */
import store from '@app/store'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'
import config from '@app/config/config'
const { dispatch } = store

let CACHE_SELECTED_FEE = false

export namespace SendActionsUpdateValues {

    export const setStepOne = (data : {cryptoValue : string, addressTo : string,  addressName: string, memo : string, isTransferAll : boolean}) => {
        dispatch({
            type: 'SET_DATA',
            ui: data
        })
    }

    export const setDict = (dictNew: {balanceRaw : 0}) => {
        const dict = store.getState().sendScreenStore.dict
        if (dict.addressFrom === dictNew.addressFrom && dict.currencyCode === dictNew.currencyCode) {
            dispatch({
                type: 'SET_DATA',
                dict: dictNew
            })
        }
    }


    export const setCommentAndFeeFromTmp = async (comment : string, rawOnly : boolean = false) => {
        if (!CACHE_SELECTED_FEE) {
            dispatch({
                type: 'SET_DATA',
                ui: {
                    comment,
                    rawOnly,
                    cryptoValueRecounted : 0
                }
            })
        } else {
            const ui = {
                comment,
                rawOnly,
                cryptoValueRecounted : 0
            }

            let newFee = false
            if (typeof CACHE_SELECTED_FEE.isCustomFee !== 'undefined' && CACHE_SELECTED_FEE.isCustomFee) {
                const countedCustomFee = await SendActionsBlockchainWrapper.getCustomFeeRate(CACHE_SELECTED_FEE)
                if (countedCustomFee) {
                    newFee = countedCustomFee
                    newFee.isCustomFee = true
                }
            } else {
                newFee = CACHE_SELECTED_FEE
            }
            if (newFee && typeof newFee.amountForTx !== 'undefined' && newFee.amountForTx) {
                // @ts-ignore
                ui.cryptoValue = newFee.amountForTx
                ui.cryptoValueRecounted = new Date().getTime()
            }
            if (config.debug.sendLogs) {
                console.log('')
                console.log('NEW_FEE', JSON.parse(JSON.stringify(newFee)))
                console.log('')
            }
            dispatch({
                type: 'SET_DATA',
                ui,
                fromBlockchain : {
                    selectedFee : newFee
                }
            })
        }
    }


    export const setTmpSelectedFee = (selectedFee : any) => {
        CACHE_SELECTED_FEE = selectedFee
    }
}
