import { Linking } from 'react-native'

import store from '../../store'

import NavStore from '../../components/navigation/NavStore'

import { decodeTransactionQrCode } from '../../services/utils'
import { strings } from '../../services/i18n'

import _ from 'lodash'
import accountDS from '../DataSource/Account/Account'
import Log from '../../services/Log/Log'

const { dispatch } = store


export function setSendData(data) {
    dispatch({
        type: 'SET_SEND_DATA',
        data: data
    })
}

export function clearSendData() {
    dispatch({
        type: 'CLEAR_SEND_DATA'
    })
}

export default new class SendActions {

    handleInitialURL = async () => {

        try {
            const initialURL = await Linking.getInitialURL()

            if(initialURL === null) return

            const res = decodeTransactionQrCode({ data: initialURL })

            const { currencies, selectedWallet } = store.getState().mainStore
            let currency = _.find(currencies, { currencyCode: res.data.currencyCode })
            let { array: accounts } = await accountDS.getAccountData(selectedWallet.wallet_hash, res.data.currencyCode)

            setSendData({
                disabled: false,
                address: res.data.address,
                value: res.data.amount.toString(),

                account: accounts[0],
                cryptocurrency: currency,

                description: strings('send.description'),
                useAllFunds: false
            })

            NavStore.goNext('SendScreen')
        } catch (e) {
            Log.err('SendActions.handleInitialURL error', e)
        }
    }
}