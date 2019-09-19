const INITIAL_STATE = {
    uahRate: 0,
    localCurrencyRate: 0,
    localCurrencySymbol: '',
    fiatRates: []
}

const fiatRatesReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'SET_INIT_DATA':
            return new Object({
                fiatRates: action.fiatRates,
                uahRate: action.uahRate,
                localCurrencyRate: action.localCurrencyRate,
                localCurrencySymbol: action.localCurrencySymbol
            })
        default:
            break
    }

    return state
}

export default fiatRatesReducer
