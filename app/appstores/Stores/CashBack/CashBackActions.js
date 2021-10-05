/**
 * @version 0.42
 */
import store from '@app/store'

import cashBackSettings from './CashBackSettings'

const { dispatch } = store

const cashBackActions = {

    updateAll : async (data, source) => {
        if (typeof data.cashbackLinkTitle !== 'undefined') {
            data.cashbackLink = cashBackSettings.getLink(data.cashbackLinkTitle)
        }
        dispatch({
            type: 'SET_CASHBACK_ALL',
            data
        })
    }
}
export default cashBackActions
