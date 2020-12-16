/**
 * @version 0.9
 */

export const NOTIFIES_GROUP = {
    BSE_ORDERS: 'BSE_ORDERS',
    PAYMENT_DETAILS: 'PAYMENT_DETAILS',
    RATES_CHANGING: 'RATES_CHANGING',
    NEWS: 'NEWS',
    ALL: 'ALL',
}

export const ALLOWED_NOTIFICATIONS = [
    NOTIFIES_GROUP.BSE_ORDERS,
    NOTIFIES_GROUP.PAYMENT_DETAILS,
    NOTIFIES_GROUP.RATES_CHANGING,
    NOTIFIES_GROUP.NEWS
]


const INITIAL_STATE = {
    appNewsList: [],
    hasNews: false,
}

const appNewsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_APP_NEWS_LIST': {
            let hasNews = false
            action.appNewsList?.forEach((news) => {
                if (ALLOWED_NOTIFICATIONS.includes(news.newsGroup) && news.newsOpenedAt === null) hasNews = true
            })
            return new Object({
                ...state,
                appNewsList: action.appNewsList,
                hasNews
            })
        }
        default:
            return state
    }
}

export default appNewsStoreReducer
