/**
 * @version 0.41
 * @author yura + ksu
 */

const INITIAL_STATE = {
    ui: {
        uiType: 'ACCOUNT_SCREEN',
        addressTo: '',
        addressName: '',
        memo: '',
        cryptoValue: '',
        cryptoValueRecounted: 0,
        comment: '',
        rawOnly : false,
        isTransferAll: false,
        dexCurrencyCode: false,
        dexOrderData: false,
        bse: {
            bseProviderType: false,
            bseOrderId: false,
            bseMinCrypto: false,
            bseTrusteeFee: false,
            bseOrderData: false
        },
        tbk: {
            transactionBoost: false,
            transactionAction: false
        },
        fioRequestDetails: false
    },
    dict: {
        inputType: 'CRYPTO',
        decimals: '',
        extendsProcessor: '',
        addressUiChecker: '',
        network: '',
        currencySymbol: '',
        currencyName: '',
        currencyCode: '',
        balanceTotalPretty: '',
        basicCurrencyBalanceTotal: '',
        basicCurrencySymbol: '',
        basicCurrencyCode: '',
        basicCurrencyRate: ''
    },
    fromBlockchain: {
        neverCounted : true,
        countedFees: {
            fees: [],
            selectedFeeIndex: -10
        },
        selectedFee: false,
        transferAllBalance: false
    }
}

const sendScreenStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'RESET_DATA_BLOCKCHAIN':
            return {
                ui: {
                    ...state.ui
                },
                dict: {
                    ...state.dict
                },
                fromBlockchain: {
                    ...action.fromBlockchain
                }
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
                    ...state.fromBlockchain,
                    ...action.fromBlockchain
                }
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
