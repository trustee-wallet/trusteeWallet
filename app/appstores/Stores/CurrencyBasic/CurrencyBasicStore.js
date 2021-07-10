/**
 * @version 0.50
 */
const INITIAL_STATE = {
    currenciesBasic: []
}

const currencyBasicStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_CURRENCIES_BASIC' :
            return  {
                currenciesBasic : action.currenciesBasic,
            }
        default:
            return state
    }
}

export default currencyBasicStoreReducer
