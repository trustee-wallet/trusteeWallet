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
            return {
                cryptoCurrencies: action.cryptoCurrencies
            }
        }
        default:
            return state
    }
}

export default currencyStoreReducer
