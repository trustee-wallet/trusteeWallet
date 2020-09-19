/**
 * @version 0.9
 */
const INITIAL_STATE = {
    appNewsList: []
}

const appNewsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_APP_NEWS_LIST':
            return new Object({
                ...state,
                appNewsList: action.appNewsList
            })
        default:
            return state
    }
}

export default appNewsStoreReducer
