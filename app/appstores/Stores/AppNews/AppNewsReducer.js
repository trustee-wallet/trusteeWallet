/**
 * @version 0.9
 */
const INITIAL_STATE = {
    appNews: []
}

const appNewsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_APP_NEWS':
            return new Object({
                ...state,
                appNews: action.appNews
            })
        default:
            return state
    }
}

export default appNewsStoreReducer
