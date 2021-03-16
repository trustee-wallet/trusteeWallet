/**
 * @version 0.41
 */
import store from '@app/store'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'
const { dispatch } = store

let CACHE_SELECTED_FEE = false

export namespace SendActionsUpdateValues {

    export const setStepOne = (data : {cryptoValue : string, addressTo : string,  addressName: string, memo : string}) => {
        dispatch({
            type: 'SET_DATA',
            ui: data
        })
    }

    export const setCommentAndFeeFromTmp = async (comment : string) => {
        if (!CACHE_SELECTED_FEE) {
            dispatch({
                type: 'SET_DATA',
                ui: {
                    comment,
                }
            })
        } else {
            const ui = {
                comment,
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
                ui.cryptoValue = CACHE_SELECTED_FEE.amountForTx
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
