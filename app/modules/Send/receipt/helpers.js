/**
 * @version 0.41
 */
import Log from '@app/services/Log/Log'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import { strings } from '@app/services/i18n'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'



const showSendError = function(e, _this) {
    const { bseOrderId, currencyCode } = _this.props.sendScreenStore.dict
    const { uiApiVersion } = _this.props.sendScreenStore.ui

    console.log('FEE change ' + uiApiVersion + ' ' + bseOrderId)
    if (uiApiVersion === 'v3' && bseOrderId) {
        console.log('not sending but could be FEE change ' + uiApiVersion + ' ' + bseOrderId)
        // ApiV3.setExchangeStatus(bseOrderId, 'FAIL')
    }


    if (e.message.indexOf('UI_') === 0) {

        /*
        Log.log('ReceiptScreen.showSendError protection ' + e.message)


        const allData = this.state.data

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('send.confirmModal.title'),
            description: strings('send.errors.' + e.message)
        }, async () => {
            CACHE_IS_SENDING = false
            if (typeof e.newAmount !== 'undefined') {
                allData.amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(e.newAmount)
                this.setState({ amountRaw: e.newAmount, data: allData })
                await this.fee.changeAmountRaw(e.newAmount)
            } else {
                this.handleSend(passwordCheck, e.message)
            }
        })
            */
        return false
    }

    const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
    const msg = e.message
    Log.errorTranslate(e, 'ReceiptScreen.showSendError', extend)

    showModal({
        type: 'INFO_MODAL',
        icon: null,
        title: strings('modal.exchange.sorry'),
        description: e.message
    }, async () => {
        if (
            msg.indexOf('SERVER_RESPONSE_PLEASE_SELECT_FEE') !== -1
            || msg.indexOf('SERVER_RESPONSE_TOO_BIG_FEE_PER_BYTE_FOR_TRANSACTION') !== -1
        ) {
            await _this.openAdvancedSettings({ toOpenCustom: true })
        }
    })

}

export {
    showSendError
}
