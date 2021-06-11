/**
 * @version 0.9
 */

import _isEqual from 'lodash/isEqual'


const INITIAL_STATE = {
    cryptoCurrencies: []
}

const currencyStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_CRYPTO_CURRENCIES': {
            if (_isEqual(state.cryptoCurrencies, action.cryptoCurrencies)) return state
            const nextArr = action.cryptoCurrencies
            const prevArr = state.cryptoCurrencies
            const mergedArray = nextArr.map(nextItem => ({
                ...prevArr.find(prevItem => nextItem.currencyCode === prevItem.currencyCode),
                ...nextItem,
            }))
            return {
                cryptoCurrencies: mergedArray
            }
        }
        case 'UPDATE_CRYPTO_CURRENCIES': {
            const nextArr = action.cryptoCurrencies
            const prevArr = state.cryptoCurrencies
            const mergedArray = prevArr.map(prevItem => ({
                ...prevItem,
                ...nextArr.find(nextItem => nextItem.currencyCode === prevItem.currencyCode),
            }))
            return {
                cryptoCurrencies: mergedArray
            }
        }
        default:
            return state
    }
}

export default currencyStoreReducer
