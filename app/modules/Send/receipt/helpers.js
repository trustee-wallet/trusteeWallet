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
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import config from '@app/config/config'

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

    const msg = e.message
    let shownMsg
    if (e.message.indexOf('cloudflare') !== -1) {
       shownMsg = strings('send.errors.SERVER_RESPONSE_CLOUDFLARE')
    } else {
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        Log.errorTranslate(e, 'ReceiptScreen.showSendError', extend)
        shownMsg = e.message
    }

    showModal({
        type: 'INFO_MODAL',
        icon: null,
        title: strings('modal.exchange.sorry'),
        description: shownMsg
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
    const { currencyCode, currencySymbol, feesCurrencySymbol } = _this.props.sendScreenStore.dict
    const { bse, cryptoValue, uiType } = _this.props.sendScreenStore.ui
    const rawOnly = typeof _this.props.sendScreenStore.ui.rawOnly !== 'undefined' && _this.props.sendScreenStore.ui.rawOnly ? _this.props.sendScreenStore.ui.rawOnly : false
    const { bseMinCrypto, bseOrderId } = bse
    
    let msg = false
    let goBack = false
    let cacheWarningNoticeValue = ''
    let newCryptoValue = false

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

    let value = cryptoValue
    if (typeof countedFees.amountForTx !== 'undefined') {
        value = countedFees.amountForTx
    } else if (typeof selectedFee.amountForTx !== 'undefined' ) {
        value = selectedFee.amountForTx
    }

    if (BlocksoftExternalSettings.getStatic('SEND_AMOUNT_CHECK') > 0 && cryptoValue > 0) {  // somehow after bse cryptoValue=0
        if (BlocksoftUtils.cutZeros(value) !== BlocksoftUtils.cutZeros(cryptoValue)) {
            if (config.debug.appErrors) {
                console.log('SendingValue ' + BlocksoftUtils.cutZeros(value) + ' != ' + BlocksoftUtils.cutZeros(cryptoValue))
            }
            Log.log('SendingValue ' + BlocksoftUtils.cutZeros(value) + ' != ' + BlocksoftUtils.cutZeros(cryptoValue))
            if (uiType === 'TRADE_SEND') {
                msg = strings('send.errors.UI_CORRECTED_AMOUNT_BSE', { symbol: currencySymbol, amount: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(value) })
                goBack = BlocksoftExternalSettings.getStatic('TRADE_SEND_AMOUNT_CHECK_FORCE_QUIT') > 0
            } else if (currencyCode !== 'TRX' && currencyCode.indexOf('TRX_') === -1 && !rawOnly) {
                msg = strings('send.errors.UI_CORRECTED_AMOUNT', { symbol: currencySymbol, amount: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(value) })
            }
            newCryptoValue = value
        }
    }


    let modalType = 'YES_NO_MODAL'
    if (!goBack && !rawOnly) {
        if (
            (typeof selectedFee.isCustomFee === 'undefined' || !selectedFee.isCustomFee)
            && typeof countedFees.showBigGasNotice !== 'undefined' && countedFees.showBigGasNotice
        ) {

            goBack = BlocksoftExternalSettings.getStatic('ETH_GAS_LIMIT_FORCE_QUIT') > 0
            if (goBack) {
                msg = strings('modal.send.bigGas', { gasLimit: selectedFee.gasLimit })
            } else {
                msg = strings('modal.send.bigGasForceQuitOff', { gasLimit: selectedFee.gasLimit })
                modalType = 'CONTINUE_CANCEL_MODAL'
            }
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
                msg += strings('modal.send.feeSmallAmount', { feesCurrencySymbol })
                goBack = BlocksoftExternalSettings.getStatic('ETH_SMALL_FEE_FORCE_QUIT') > 0
            }
        }
    }
    return { msg, cacheWarningNoticeValue, goBack, modalType, newCryptoValue }
}
export {
    showSendError, checkLoadedFee
}
