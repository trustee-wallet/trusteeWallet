/**
 * @version 0.9
 */
import {
    CashBackActionTypes,
    CashBackState,
    SET_CASH_BACK_API_DATA,
    SET_CASH_BACK_TOKEN,
    SET_CASH_BACK_PARENT_TOKEN
} from './Types'

const initialState: CashBackState = {
    cashBackParentToken: '',
    cashBackToken: '',
    cashBackLinkPrefix: 'https://trustee.deals/link/',
    cashBackApiData: {
        cashBackBalance: 0,
        level2: false,
        level2Users: 0,
        weeklyVolume: 0,
        overallVolume: 0,
        invitedUsers: 0,
        cashBackLink: ''
    }
}

const cashBackStoreReducer = (
    state = initialState,
    action: CashBackActionTypes
): CashBackState => {

    switch (action.type) {
        case SET_CASH_BACK_API_DATA:
            return {
                ...state,
                cashBackApiData: action.payload
            }
        case SET_CASH_BACK_TOKEN:
            return {
                ...state,
                ...action.payload
            }
        case SET_CASH_BACK_PARENT_TOKEN:
            return {
                ...state,
                ...action.payload
            }
        default:
            return state
    }
}

export default cashBackStoreReducer
