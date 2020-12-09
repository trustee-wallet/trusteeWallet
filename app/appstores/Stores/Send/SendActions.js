/**
 * @version 0.9
 */
import { Linking } from 'react-native'
import store from '../../../store'

import NavStore from '../../../components/navigation/NavStore'

import { decodeTransactionQrCode } from '../../../services/UI/Qr/QrScan'
import { strings } from '../../../services/i18n'

import _ from 'lodash'
import accountDS from '../../DataSource/Account/Account'
import Log from '../../../services/Log/Log'
import SendTmpConstants from '../../../modules/Send/elements/SendTmpConstants'

const NativeLinking = require('../../../../node_modules/react-native/Libraries/Linking/NativeLinking').default
const { dispatch } = store


export function setSendData(data) {
    // @todo unify with usual
    console.log('SendActions.setSendData', {...data})
    dispatch({
        type: 'SET_SEND_DATA',
        data: data
    })
}

export function clearSendData() {
    console.log('SendActions.clearSendData')
    SendTmpConstants.SELECTED_FEE = false
    SendTmpConstants.COUNTED_FEES = false
    SendTmpConstants.ACCOUNT_DATA = false
    dispatch({
        type: 'CLEAR_SEND_DATA'
    })
}

export default new class SendActions {

    isNeedToInit = true

    init = () => {
        if (this.isNeedToInit) {
            this.handleInitialURL(true)
            Linking.addEventListener('url', (data) => this.handleInitialURL(false, data.url))
            this.isNeedToInit = false
        }
    }

    handleInitialURL = async (needGetUrl, url) => {

        let initialURL = url

        try {
            if (needGetUrl) {
                initialURL = await NativeLinking.getInitialURL()
            }
        } catch (e) {
            Log.err('SendActions.handleInitialURL get error ' + e.message, initialURL)
            return
        }
        Log.log('SendActions.handleInitialURL get success', initialURL)

        if (typeof initialURL === 'undefined' || initialURL === null) return
        try {

            let type = initialURL.split('//')[1]

            if (typeof type === 'undefined') return

            const data = type.split('/')[1]
            type = type.split('/')[0]
            if (typeof data === 'undefined' || typeof type === 'undefined') return

            if (type === 'pay') {
                const res = await decodeTransactionQrCode({ data: data })
                if (typeof (res.data) === 'undefined') {
                    throw new Error('res.data is empty')
                }

                if (initialURL.indexOf('trustee.page.link') === -1) {
                    const { selectedWallet } = store.getState().mainStore
                    const { cryptoCurrencies } = store.getState().currencyStore
                    const { accountList } = store.getState().accountStore
                    const currency = _.find(cryptoCurrencies, { currencyCode: res.data.currencyCode })
                    const account = accountList[selectedWallet.walletHash][currency.currencyCode]

                    setSendData({
                        disabled: typeof res.data.needToDisable !== 'undefined' && !!(+res.data.needToDisable),
                        address: res.data.address,
                        value: res.data.amount ? res.data.amount.toString() : '0',

                        account: account,
                        cryptoCurrency: currency,

                        comment: res.data.label,
                        description: strings('send.description'),
                        useAllFunds: false
                    })

                    NavStore.goNext('SendScreen')
                }
            }
        } catch (e) {
            Log.err('SendActions.handleInitialURL decode error ' + e.message)
            return
        }
        Log.log('SendActions.handleInitialURL decode success')
    }
}