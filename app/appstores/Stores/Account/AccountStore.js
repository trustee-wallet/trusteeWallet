/**
 * @version 0.9
 */

import _isEqual from 'lodash/isEqual'


const INITIAL_STATE = {
    accountList: {}
}

const accountStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_ACCOUNT_LIST': {
            if (_isEqual(state.accountList, action.accountList)) return state
            return {
                accountList: action.accountList
            }
        }
        default:
            return state
    }
}

export default accountStoreReducer
