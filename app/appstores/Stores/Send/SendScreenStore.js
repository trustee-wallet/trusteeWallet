/**
 * @version 0.41
 * @author yura + ksu
 */

const INITIAL_STATE = {
    ui: {
        uiType: 'ACCOUNT_SCREEN',
        addressTo : '',
        memo : '',
        cryptoValue : '',
        comment : '',

        bseProviderType : false,
        bseOrderId: false,
        bseMinCrypto : false,
        bseTrusteeFee : false,
        bseOrderData : false,
        isFioRequest : false
    },
    dict : {
        inputType : 'CRYPTO',
        decimals : '',
        extendsProcessor : '',
        addressUiChecker : '',
        network : '',
        currencySymbol : '',
        currencyName : '',
        currencyCode : '',
        balanceTotalPretty : '',
        basicCurrencyBalanceTotal : '',
        basicCurrencySymbol : '',
        basicCurrencyCode : '',
        basicCurrencyRate : ''
    },
    fromBlockchain : {
        countedFees : {
            fees : [],
            selectedFeeIndex : -1
        },
        selectedFee : false,
        transferAllBalance : false
    }
}

const sendScreenStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_DATA_BLOCKCHAIN':
            return {
                ui: {
                    ...state.ui,
                },
                dict: {
                    ...state.dict,
                },
                fromBlockchain: {
                    ...action.fromBlockchain
                },
            }
        case 'SET_DATA':
            return {
                ui: {
                    ...state.ui,
                    ...action.ui
                },
                dict: {
                    ...state.dict,
                    ...action.dict
                },
                fromBlockchain: {
                    ...state.fromBlockchain
                },
            }
        case 'RESET_DATA':
            return {
                ui: {
                    ...INITIAL_STATE.ui,
                    ...action.ui
                },
                dict: {
                    ...INITIAL_STATE.dict,
                    ...action.dict
                },
                fromBlockchain: {
                    ...INITIAL_STATE.fromBlockchain
                }
            }
        case 'CLEAN_DATA':
            return {
                ui: {},
                dict: {},
                fromBlockchain: {}
            }
        default:
            return state
    }
}

export default sendScreenStoreReducer
