/**
 * @version 0.41
 */
import store from '@app/store'
const { dispatch } = store

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

    export const setComment = (comment : string) => {
        dispatch({
            type: 'SET_DATA',
            ui: {
                comment,
            }
        })
    }
}
