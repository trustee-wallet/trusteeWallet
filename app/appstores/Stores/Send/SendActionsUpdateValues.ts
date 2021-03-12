/**
 * @version 0.41
 */
import store from '@app/store'
const { dispatch } = store

let CACHE_SELECTED_FEE = false

export namespace SendActionsUpdateValues {

    export const setStepOne = (cryptoValue : string, addressTo : string, memo : string) => {
        dispatch({
            type: 'SET_DATA',
            ui: {
                cryptoValue,
                addressTo,
                memo
            }
        })
    }

    export const setCommentAndFeeFromTmp = (comment : string) => {
        if (!CACHE_SELECTED_FEE) {
            dispatch({
                type: 'SET_DATA',
                ui: {
                    comment,
                }
            })
        } else {
            dispatch({
                type: 'SET_DATA',
                ui: {
                    comment,
                },
                fromBlockchain : {
                    selectedFee : CACHE_SELECTED_FEE
                }
            })
        }
    }


    export const setTmpSelectedFee = (selectedFee : any) => {
        CACHE_SELECTED_FEE = selectedFee
    }
}
