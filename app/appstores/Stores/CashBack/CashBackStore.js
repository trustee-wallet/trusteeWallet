/**
 * @version 0.11
 */
const INITIAL_STATE = {
    dataFromApi: {},
    error : {},
    cashbackLinkTitle : '',
    cashbackLink : '',
    parentToken : ''
}

const cashBackStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_CASHBACK_DATA_FROM_API':
            return new Object({
                ...state,
                dataFromApi: action.dataFromApi
            })
        case 'SET_CASHBACK_ERROR':
            return new Object({
                ...state,
                error: action.error
            })
        case 'SET_CASHBACK_LINK':
            return new Object({
                ...state,
                cashbackLinkTitle : action.cashbackLinkTitle,
                cashbackLink : action.cashbackLink
            })
        case 'SET_PARENT_TOKEN' :
            return new Object({
                ...state,
                parentToken : action.parentToken
            })
        default:
            return state
    }
}

export default cashBackStoreReducer
