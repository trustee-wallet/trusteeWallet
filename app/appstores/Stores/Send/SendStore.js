/**
 * @version 0.9
 */
const INITIAL_STATE = {
    data: {}
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
        default:
            return state
    }
}

export default sendStoreReducer
