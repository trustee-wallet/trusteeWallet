import store from '../../store'

import api from '../../services/api'
import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import i18n from '../../services/i18n'

import { hideModal, showModal } from './ModalActions'

import NavStore from '../../components/navigation/NavStore'

const { dispatch } = store


export default new class ExchangeActions {

    init = async () => {
        try {
            const res = await api.getExchangeData()

            const tradeApiConfig = res.data.exchangeWays.buy.concat(res.data.exchangeWays.sell)
            const exchangeApiConfig = res.data.exchangeWays.exchange

            dispatch({
                type: 'SET_TRADE_API_CONFIG',
                tradeApiConfig: { exchangeWays: tradeApiConfig }
            })
            dispatch({
                type: 'SET_EXCHANGE_API_CONFIG',
                exchangeApiConfig
            })
        } catch (e) {
            Log.err('ACT/Exchange InitialScreen error 1 ' + e.message)
        }
    }

    handleGetExchangeAPIConfig = () => {

    }

    handleSetTradeType = tradeTypeObj => {
        dispatch({
            type: 'SET_TRADE_TYPE',
            tradeType: tradeTypeObj.tradeType
        })
    }


    getExchangeStatus = (callback) => {

            try {
                const { exchangeMessage } = res.data.exchangeStatus

                let message = exchangeMessage.find((item) => item.code.includes(i18n.locale.split('-')[0]))

                typeof message == 'undefined' ? message = exchangeMessage[0] : message

                const { title, description } = message

                showModal({
                    type: 'CHOOSE_INFO_MODAL',
                    data: {
                        title,
                        description,
                        declineCallback: () => {
                            MarketingEvent.logEvent('exchange_init_modal_decline', { title, description })
                            NavStore.goBack()
                            hideModal()
                        },
                        acceptCallback: () => {
                            MarketingEvent.logEvent('exchange_init_modal_accept', { title, description })
                            hideModal()
                            callback(res)
                        }
                    }
                })
            } catch (e) {
                Log.err('ACT/Exchange InitialScreen error 2 ' + e.message)
            }


        // setLoaderStatus(true)

        // api.getExchangeData().then((res) => {
        //
        //     try {
        //         if (!(res.status === 'success')) {
        //             Log.err('ACT/Exchange InitialScreen error with data', res)
        //             return false
        //         }
        //
        //         const { info } = res.data.exchangeStatus
        //
        //         if (!info){
        //             callback(res)
        //             return
        //         }
        //
        //         const { exchangeMessage } = res.data.exchangeStatus
        //
        //         let message = exchangeMessage.find((item) => item.code.includes(i18n.locale.split('-')[0]))
        //
        //         typeof message == 'undefined' ? message = exchangeMessage[0] : message
        //
        //         const { title, description } = message
        //
        //         showModal({
        //             type: 'CHOOSE_INFO_MODAL',
        //             data: {
        //                 title,
        //                 description,
        //                 declineCallback: () => {
        //                     MarketingEvent.logEvent('exchange_init_modal_decline', { title, description })
        //                     NavStore.goBack()
        //                     hideModal()
        //                 },
        //                 acceptCallback: () => {
        //                     MarketingEvent.logEvent('exchange_init_modal_accept', { title, description })
        //                     hideModal()
        //                     callback(res)
        //                 }
        //             }
        //         })
        //     } catch (e) {
        //         Log.err('ACT/Exchange InitialScreen error', e.message)
        //     }
        //
        //     setLoaderStatus(false)
        // })

        this.handleSetTradeType({ tradeType: 'BUY' })
        NavStore.goNext('TradeScreenStack')
    }

    getExchangeStatusWithoutRequest = (res, callback) => {
        try {
            if (!(res.status === 'success')) {
                Log.err('ACT/Exchange InitialScreen error with data', res)
                return false
            }

            const { info } = res.data.exchangeStatus

            if (!info){
                callback(res)
                return
            }

            const { exchangeMessage } = res.data.exchangeStatus

            let message = exchangeMessage.find((item) => item.code.includes(i18n.locale.split('-')[0]))

            typeof message == 'undefined' ? message = exchangeMessage[0] : message

            const { title, description } = message

            showModal({
                type: 'CHOOSE_INFO_MODAL',
                data: {
                    title,
                    description,
                    declineCallback: () => {
                        MarkeringEvent.logEvent('exchange_init_modal_decline', { title, description })
                        NavStore.goBack()
                        hideModal()
                    },
                    acceptCallback: () => {
                        MarkeringEvent.logEvent('exchange_init_modal_accept', { title, description })
                        hideModal()
                        callback(res)
                    }
                }
            })
        } catch (e) {
            Log.err('ACT/Exchange InitialScreen error 3 ' + e.message)
        }
    }

}

