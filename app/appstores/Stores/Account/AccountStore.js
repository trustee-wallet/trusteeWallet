/**
 * @version 0.9
 */
const INITIAL_STATE = {
    accounts: []
}

const accountStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_ACCOUNTS':
            return {
                ...state,
                accounts: action.accounts
            }
        default:
            return state
    }
}

export default accountStoreReducer
