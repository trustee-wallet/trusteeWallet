import api from '../../services/api'
import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import i18n from '../../services/i18n'
import { hideModal, showModal } from './ModalActions'

import NavStore from '../../components/navigation/NavStore'
import { setLoaderStatus } from './MainStoreActions'

export default new class ExchangeActions {

    init() {

    }

    getExchangeStatus = (callback) => {

        setLoaderStatus(true)

        api.getExchangeData().then((res) => {

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
                Log.err('ACT/Exchange InitialScreen error', e.message)
            }

            setLoaderStatus(false)
        })
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
            Log.err('ACT/Exchange InitialScreen error', e.message)
        }
    }

}

