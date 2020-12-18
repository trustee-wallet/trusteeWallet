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
    recountFees = async (data) => {
        console.log('SendBasicScreen.recountFees init ', JSON.parse(JSON.stringify(data)))

        const currencyCode = data.currencyCode

        if (data.addressTo === '') {
            return false
        }

        try {
            const { countedFees, selectedFee } = await SendActions.countFees(data)

            if (countedFees) {
                console.log('SendBasicScreen.recountFees result ', JSON.parse(JSON.stringify(countedFees)))
            } else {
                console.log('SendBasicScreen.recountFees result ', countedFees)
            }

            return { countedFees, selectedFee }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendBasicScreen.recountFees', e)
            }
            const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            Log.errorTranslate(e, 'SendBasicScreen.recountFees', typeof extend.addressCurrencyCode === 'undefined' ? extend.currencySymbol : extend.addressCurrencyCode, JSON.stringify(extend))

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.qrScanner.sorry'),
                description: e.message,
                error: e
            })

            return false
        }
    }

    openAdvancedSettings = async (additionalParams) => {
        // late count
        const newSendScreenData = JSON.parse(JSON.stringify(this.state.sendScreenData))
        const { selectedFee } = await this.recountFees(newSendScreenData)
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
            const version = sendScreenData.uiApiVersion || 'v3'
            const removeId = sendScreenData.bseOrderId
            console.log('SendBasicScreen.goBack with version ' + version + ' removeId ' + removeId)
            if (version === 'v2') {
                Api.setExchangeStatus(removeId, 'close')
            } else {
                ApiV3.setExchangeStatus(removeId, 'close')
            }
            UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true, removeId, source: 'CANCEL' })
        } else {
            console.log('SendBasicScreen.goBack')
        }

        if (closeScreen) {
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
            prettyFeeSymbol = '?' //currencySymbol
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
        return (
            <>
                <CheckData
                    name={strings('send.receiptScreen.minerFee')}
                    value={`${prettyFee} ${prettyFeeSymbol}`}
                    subvalue={fiatFee}
                />
                {
                    selectedFee.isCustomFee && selectedFee.nonceForTx ?
                        <CheckData
                            name={strings('send.receiptScreen.customNonce')}
                            value={selectedFee.nonceForTx + ''}
                        /> : null
                }
            </>
        )
    }

}