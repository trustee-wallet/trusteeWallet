/**
 * @version 0.30
 */

import React, { Component } from 'react'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'
import CheckData from './elements/CheckData'

import Api from '../../services/Api/Api'
import ApiV3 from '../../services/Api/ApiV3'

import NavStore from '../../components/navigation/NavStore'
import { strings } from '../../services/i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { BlocksoftTransfer } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import config from '../../config/config'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import Log from '../../services/Log/Log'
import { Keyboard, Text, View } from 'react-native'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'
import { SendActions } from '../../appstores/Stores/Send/SendActions'
import { SendTmpData } from '../../appstores/Stores/Send/SendTmpData'

export default class SendBasicScreen extends Component {

    /**
     *
     * @returns {Promise<{countedFees, selectedFee}>}
     */
    recountFees = async (data, source) => {
        await Log.log('SendBasicScreen.recountFees ' + source + ' init ', JSON.parse(JSON.stringify(data)))

        const currencyCode = data.currencyCode
        if (data.addressTo === '') {
            if (currencyCode === 'XLM' || currencyCode === 'BNB') {
                // do nothing @todo 100% fix? - why twice checked?
            } else {
                return false
            }
        }

        try {
            if (config.debug.sendLogs) {
                console.log('')
                console.log('SendBasicScreen.recountFees ' + source + ' start ', JSON.parse(JSON.stringify(data)))
            }

            const { countedFees, selectedFee } = await SendActions.countFees(data)

            if (config.debug.sendLogs) {
                console.log('SendBasicScreen.recountFees ' + source + ' result ', JSON.parse(JSON.stringify({countedFees, selectedFee})))
            }
            await Log.log('SendBasicScreen.recountFees ' + source + ' result ', {countedFees, selectedFee})

            return { countedFees, selectedFee }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendBasicScreen.recountFees ' + source + ' error ' + e.message, e)
            }

            const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            Log.errorTranslate(e, 'SendBasicScreen.recountFees', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

            Keyboard.dismiss()

            if (source.indexOf('Send.SendBasicScreen.openAdvancedScreen') === -1) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.qrScanner.sorry'),
                    description: e.message,
                    error: e
                })
            }

            return false
        }
    }

    openAdvancedSettings = async (additionalParams) => {
        // late count
        setLoaderStatus(true)

        const newSendScreenData = JSON.parse(JSON.stringify(this.state.sendScreenData))
        const { selectedFee } = await this.recountFees(newSendScreenData, 'Send.SendBasicScreen.openAdvancedScreen')
        newSendScreenData.selectedFee = selectedFee

        setLoaderStatus(false)

        NavStore.goNext('SendAdvancedScreen', {
            additionalParams
        })
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }

    closeAction = async (closeScreen=false) => {

        const { sendScreenData } = this.state
        if (typeof sendScreenData !== 'undefined' && sendScreenData && typeof sendScreenData.bseOrderId !== 'undefined' && sendScreenData.bseOrderId) {
            const version = this.props.sendScreenStore.uiApiVersion || 'v3'
            const removeId = sendScreenData.bseOrderId
            if (version === 'v2') {
                Api.setExchangeStatus(removeId, 'close')
            } else {
                ApiV3.setExchangeStatus(removeId, 'CLOSE')
            }
            UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true, removeId, source: 'CANCEL' })
        }

        if (closeScreen) {
            SendActions.cleanData()
            NavStore.reset('DashboardStack')
        } else {
            NavStore.goBack()
        }
    }

    modalInfo = () => {
        const currencyCode = this.state.account.currencyCode

        const description = strings(`send.infoModal.${currencyCode}`)

        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('send.infoModal.title'),
            description
        })
    }

    renderMinerFee = (onlyUseAllFunds = false) => {

        const { GRID_SIZE, colors } = this.context

        const { useAllFunds, sendScreenData, account } = this.state

        let selectedFee = false // typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }

        if (typeof account === 'undefined' || !account || !sendScreenData || typeof account.basicCurrencySymbol === 'undefined' || account.basicCurrencySymbol === '') {
            return <View style={{ flex: 1, backgroundColor: colors.common.background }}><Text></Text></View>
        }

        if (onlyUseAllFunds && !useAllFunds) {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not useAllFunds')
            return false
        }
        if (typeof selectedFee === 'undefined' || !selectedFee || typeof selectedFee.feeForTx === 'undefined') {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not selectedFee')
            return false
        }

        Log.log('Send.SendBasicScreen.renderMinerFee state', {
            selectedFee,
            useAllFunds,
            onlyUseAllFunds
        })

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = account


        let prettyFee
        let prettyFeeSymbol = feesCurrencySymbol
        let feeBasicCurrencySymbol = basicCurrencySymbol
        let feeBasicAmount = 0

        if (typeof selectedFee.feeForTxDelegated !== 'undefined') {
            prettyFeeSymbol = account.currencySymbol
            prettyFee = selectedFee.feeForTxCurrencyAmount
            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(selectedFee.feeForTxBasicAmount, 5).justCutted
            feeBasicCurrencySymbol = selectedFee.feeForTxBasicSymbol
        } else {
            prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(selectedFee.feeForTx)
            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                value: prettyFee,
                currencyCode: feesCurrencyCode,
                basicCurrencyRate: feeRates.basicCurrencyRate
            }), 5).justCutted
            prettyFee = BlocksoftPrettyNumbers.makeCut(prettyFee, 5).justCutted
        }

        let fiatFee
        if (Number(feeBasicAmount) < 0.01) {
            fiatFee = `< ${feeBasicCurrencySymbol} 0.01`
        } else {
            fiatFee = `${feeBasicCurrencySymbol} ${feeBasicAmount}`
        }

        Log.log('Send.SendBasicScreen.renderMinerFee prettyFee ' + prettyFee + ' prettyFeeSymbol ' + prettyFeeSymbol + ' fiatFee ' + fiatFee)
        let nonceForTxTitle = false
        if (selectedFee.isCustomFee) {
            nonceForTxTitle = 'send.receiptScreen.customNonce'
        } else if (typeof selectedFee.showNonce !== 'undefined' && selectedFee.showNonce) {
            nonceForTxTitle = 'send.receiptScreen.nonce'
        }

        return (
            <>
                <CheckData
                    name={strings('send.receiptScreen.minerFee')}
                    value={`${prettyFee} ${prettyFeeSymbol}`}
                    subvalue={fiatFee}
                />
                {
                    nonceForTxTitle && typeof selectedFee.nonceForTx !== 'undefined' && selectedFee.nonceForTx && selectedFee.nonceForTx.toString() !== '-1' ?
                        <CheckData
                            name={strings(nonceForTxTitle)}
                            value={selectedFee.nonceForTx + ''}
                        /> : null
                }
            </>
        )
    }

}
