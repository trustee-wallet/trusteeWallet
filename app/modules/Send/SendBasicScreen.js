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

        if (data.addressTo === "") {
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

    openAdvancedSettings = async () => {
        if (this.state.loadFee) {
            setLoaderStatus(true)
            setTimeout(() => {
                try {
                    // setLoaderStatus(true)
                    this.openAdvancedSettings()
                } catch (e) {
                    console.log('SendBasicScreen.openAdvancedSettings loading fees')
                }
            }, 100)
        } else {
            setLoaderStatus(false)
            NavStore.goNext('SendAdvancedScreen', {
                sendScreenData : this.state.sendScreenData
            })
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }

    closeAction = async () => {

        const { sendScreenData } = this.state
        if (typeof sendScreenData !== 'undefined' && sendScreenData && typeof sendScreenData.toTransactionJSON !== 'undefined' && sendScreenData.toTransactionJSON && sendScreenData.toTransactionJSON.bseOrderID !== 'undefined') {
            const version = sendScreenData.uiApiVersion || 'v3'
            const removeId = sendScreenData.toTransactionJSON.bseOrderID
            console.log('SendBasicScreen.goBack with version ' + version + ' removeId ' + removeId)
            if (version === 'v2') {
                Api.setExchangeStatus(removeId, 'close')
            } else {
                ApiV3.setExchangeStatus(removeId, 'close')
            }
            UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({force: true, removeId, source: 'CANCEL'})
        } else {
            console.log('SendBasicScreen.goBack')
        }

        NavStore.goBack()
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

        const { useAllFunds, sendScreenData, account } = this.state

        let selectedFee = false // typeof sendScreenData.selectedFee !== 'undefined' ? sendScreenData.selectedFee
        if (!selectedFee) {
            const tmp = SendTmpData.getCountedFees()
            selectedFee = typeof tmp.selectedFee !== 'undefined' ? tmp.selectedFee : false
        }

        Log.log('Send.SendBasicScreen.renderMinerFee state', JSON.parse(JSON.stringify({ selectedFee, useAllFunds, onlyUseAllFunds })))

        if (typeof account === 'undefined' || !account || !sendScreenData || typeof account.basicCurrencySymbol === 'undefined' || account.basicCurrencySymbol === "") {
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
            fiatFee = `> ${feeBasicCurrencySymbol} 0.01`
        } else {
            fiatFee = `${feeBasicCurrencySymbol} ${feeBasicAmount}`
        }

        Log.log('Send.SendBasicScreen.renderMinerFee prettyFee ' + prettyFee + ' prettyFeeSymbol ' + prettyFeeSymbol + ' fiatFee ' + fiatFee)
        return (
            <>
            <CheckData
                name={'Miner fee'}
                value={`${prettyFee} ${prettyFeeSymbol}`}
                subvalue={fiatFee}
            />
            {
                selectedFee.isCustomFee && selectedFee.nonceForTx ?
                    <CheckData
                        name={'Custom nonce'}
                        value={selectedFee.nonceForTx + ''}
                    /> : null
            }
            </>
        )
    }

}