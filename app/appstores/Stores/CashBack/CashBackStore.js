/**
 * @version 0.42
 */
const INITIAL_STATE = {
    dataFromApi: {},
    error: {},
    cashbackLinkTitle: '',
    cashbackLink: '',
    cashbackToken : '',
    parentToken: ''
}

const cashBackStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_CASHBACK_ALL':
            return {
                ...state,
                ...action.data
            }
        default:
            return state
    }
}

export default cashBackStoreReducer
