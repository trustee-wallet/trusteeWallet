/**
 * @version 0.9
 */
const INITIAL_STATE = {
    data: {},
    countedFees: {},
    selectedFee: {},
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
                countedFees: action.countedFees,
                selectedFee: action.selectedFee
            }
        default:
            return state
    }
}

export default sendStoreReducer
