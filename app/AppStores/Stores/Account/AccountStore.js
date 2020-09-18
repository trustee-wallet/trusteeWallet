/**
 * @version 0.9
 */
const INITIAL_STATE = {
    accountList: []
}

const accountStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_ACCOUNT_LIST':
            return {
                ...state,
                accountList: action.accountList
            }
        default:
            return state
    }
}

export default accountStoreReducer
