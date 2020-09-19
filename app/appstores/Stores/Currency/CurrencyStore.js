/**
 * @version 0.9
 */
const INITIAL_STATE = {
    cryptoCurrencies: []
}

const currencyStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_CRYPTO_CURRENCIES':
            return new Object({
                ...state,
                cryptoCurrencies: action.cryptoCurrencies
            })
        default:
            return state
    }
}

export default currencyStoreReducer
