/**
 * @version 0.9
 */
import store from '../../../store'

import AsyncStorage from '@react-native-community/async-storage'

import Api from '../../../services/Api/Api'
import Log from '../../../services/Log/Log'
import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'

const { dispatch } = store


export default new class ExchangeOrdersActions {

    setExchangeOrderList = exchangeOrderList => {
        dispatch({
            type: 'SET_EXCHANGE_ORDERS_DATA',
            exchangeOrders: exchangeOrderList
        })
    }
}

