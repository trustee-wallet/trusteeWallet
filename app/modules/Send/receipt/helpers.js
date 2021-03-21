/**
 * @version 0.41
 */
import Log from '@app/services/Log/Log'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import { strings } from '@app/services/i18n'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'


const showSendError = function(e, _this, passwordCheck) {
    const { currencyCode } = _this.props.sendScreenStore.dict

    if (e.message.indexOf('UI_') === 0) {
        Log.log('ReceiptScreen.showSendError protection ' + e.message)
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('send.confirmModal.title'),
            description: strings('send.errors.' + e.message)
        }, async () => {
            _this.handleSend(passwordCheck, e.message)
        })

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


const checkLoadedFee = function(_this) {
    const { countedFees, selectedFee } = _this.props.sendScreenStore.fromBlockchain
    const { currencyCode } = _this.props.sendScreenStore.dict
    const { bse, cryptoValue } = _this.props.sendScreenStore.ui
    const { bseMinCrypto, bseOrderId } = bse

    let msg = false
    let goBack = false
    let cacheWarningNoticeValue = ''

    if (typeof bseMinCrypto !== 'undefined' && bseMinCrypto * 1 > 0) {
        if (typeof selectedFee.amountForTx !== 'undefined' && bseMinCrypto * 1 > selectedFee.amountForTx * 1) {
            msg = strings('modal.send.bseMinCrypto', { limit: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(bseMinCrypto) })
            goBack = true
            cacheWarningNoticeValue = 'bseMinCrypto_' + bseOrderId + '_' + selectedFee.amountForTx
        } else if (typeof cryptoValue !== 'undefined' && bseMinCrypto * 1 > cryptoValue * 1) {
            msg = strings('modal.send.bseMinCrypto', { limit: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(bseMinCrypto) })
            goBack = true
            cacheWarningNoticeValue = 'bseMinCrypto_' + bseOrderId + '_' + cryptoValue
        }
    }

    if (!goBack) {
        if (
            (typeof selectedFee.isCustomFee === 'undefined' || !selectedFee.isCustomFee)
            && typeof countedFees.showBigGasNotice !== 'undefined' && countedFees.showBigGasNotice
        ) {
            msg = strings('modal.send.bigGas', { gasLimit: selectedFee.gasLimit })
            goBack = BlocksoftExternalSettings.getStatic('ETH_GAS_LIMIT_FORCE_QUIT') > 0
            cacheWarningNoticeValue = countedFees.showBigGasNotice
        } else if (typeof countedFees.showBlockedBalanceNotice !== 'undefined' && countedFees.showBlockedBalanceNotice) {
            msg = strings('modal.send.blockedBalance', { free: countedFees.showBlockedBalanceFree })
            goBack = BlocksoftExternalSettings.getStatic('ETH_BLOCKED_BALANCE_FORCE_QUIT') > 0
            cacheWarningNoticeValue = countedFees.showBlockedBalanceNotice
        } else if (typeof selectedFee.isCustomFee !== 'undefined' && selectedFee.isCustomFee) {
            // do nothing !!!!
        } else {
            if (typeof countedFees.showLongQueryNotice !== 'undefined' && countedFees.showLongQueryNotice) {
                const ethAllowLongQuery = settingsActions.getSettingStatic('ethAllowLongQuery')
                if (ethAllowLongQuery !== '1') {
                    msg = strings('modal.send.longQuerySettingOff')
                    goBack = BlocksoftExternalSettings.getStatic('ETH_LONG_QUERY_FORCE_QUIT') > 0
                } else {
                    msg = strings('modal.send.longQuery')
                }
                if (countedFees.showLongQueryNoticeTxs && countedFees.showLongQueryNoticeTxs[0] !== 'undefined') {
                    msg += ' ' + countedFees.showLongQueryNoticeTxs[0].currencyCode
                    msg += ' ' + countedFees.showLongQueryNoticeTxs[0].txHash
                }
                cacheWarningNoticeValue = countedFees.showLongQueryNotice
            }
            if (typeof countedFees.showSmallFeeNotice !== 'undefined' && countedFees.showSmallFeeNotice) {
                if (msg) {
                    msg += ' + '
                    cacheWarningNoticeValue += '_' + countedFees.showSmallFeeNotice
                } else {
                    msg = ''
                    cacheWarningNoticeValue = countedFees.showSmallFeeNotice
                }
                msg += strings('modal.send.feeSmallAmount')
            }
        }
    }
    return { msg, cacheWarningNoticeValue, goBack }
}
export {
    showSendError, checkLoadedFee
}
