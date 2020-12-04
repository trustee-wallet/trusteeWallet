/**
 * @version 0.9
 */
const INITIAL_STATE = {
    data: {},
    countedFee: {},
    selectedFee: {},
    customFee: {}
}

const sendStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_SEND_DATA':
            return {
                ...state,
                data: action.data
            }
        case 'CLEAR_SEND_DATA':
            return {
                ...INITIAL_STATE
            }
        case 'SET_FEE':
            return {
                ...state,
                countedFee: action.countedFee,
                selectedFee: action.selectedFee,
                customFee: action.customFee
            }
        default:
            return state
    }
}

export default sendStoreReducer
