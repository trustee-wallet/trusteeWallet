import React, { Component } from 'react'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'
import CheckData from './elements/CheckData'
import api from '../../services/Api/Api'
import NavStore from '../../components/navigation/NavStore'
import { strings } from '../../services/i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { BlocksoftTransfer } from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import config from '../../config/config'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import Log from '../../services/Log/Log'
import { Keyboard } from 'react-native'

export default class SendBasicScreen extends Component {


    recountFees = async (params) => {
        console.log('SendBasicScreen.recountFees init ')
        let countedFees, selectedFee, currencyCode

        try {
            let data
            if (typeof params.data !== 'undefined') {
                data = params.data
            } else {
                data = this.state
            }

            const {
                amountRaw,
                address: addressTo,
                useAllFunds,
                memo,
                toTransactionJSON,
                transactionSpeedUp,
                transactionReplaceByFee
            } = data

            const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee } = data.wallet
            const {
                address: addressFrom,
                derivationPath,
                accountJson,
            } = data.account

            currencyCode = data.account.currencyCode


            const txData = {
                currencyCode,
                walletHash,
                derivationPath: derivationPath,
                addressFrom: addressFrom,
                addressTo: addressTo,
                amount: amountRaw,
                isTransferAll: useAllFunds,
                useOnlyConfirmed: !(walletUseUnconfirmed === 1),
                allowReplaceByFee: walletAllowReplaceByFee === 1,
                transactionReplaceByFee,
                transactionSpeedUp,
                memo,
                accountJson,
                transactionJson: toTransactionJSON
            }


            if (typeof params.amountRaw !== 'undefined') {
                txData.amount = params.amountRaw
                console.log('SendBasicScreen.recountFees amountRaw ' + txData.amount)
            }
            if (typeof params.addressTo !== 'undefined') {
                txData.addressTo = params.addressTo
                console.log('SendBasicScreen.recountFees addressTo ' + txData.addressTo)
            }

            console.log('SendBasicScreen.recountFees txData ', JSON.parse(JSON.stringify(txData)))
            countedFees = await BlocksoftTransfer.getFeeRate(txData)
            countedFees.feesCountedForData = txData
            if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >=0) {
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            }

            console.log('SendBasicScreen.recountFees result ', JSON.parse(JSON.stringify(countedFees)))
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
        }
        return { countedFees, selectedFee }
    }

    openAdvancedSettings = () => {
        const { countedFees, selectedFee, useAllFunds } = this.state
        console.log('Send.SendBasicScreen.openAdvancedSettings state', JSON.parse(JSON.stringify({
            countedFees,
            selectedFee,
            useAllFunds
        })))
        if (!countedFees) {
            console.log('YURA, plz show loaded here')
        } else {
            NavStore.goNext('SendAdvancedScreen', {
                data: {
                    countedFees,
                    selectedFee,
                    useAllFunds
                }
            })
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }

    closeAction = () => {
        if (typeof this.props.send !== 'undefined' && this.props.send && typeof this.props.send.data !== 'undefined') {
            const { toTransactionJSON } = this.props.send.data
            if (typeof toTransactionJSON !== 'undefined' && typeof toTransactionJSON.bseOrderID !== 'undefined') {
                api.setExchangeStatus(toTransactionJSON.bseOrderID, 'close')
            }
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

        const { countedFees, selectedFee, useAllFunds } = this.state

        Log.log('Send.SendBasicScreen.renderMinerFee state', JSON.parse(JSON.stringify({
            countedFees,
            selectedFee,
            useAllFunds,
            onlyUseAllFunds
        })))

        if (onlyUseAllFunds && !useAllFunds) {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not useAllFunds')
            return false
        }
        if (typeof selectedFee === 'undefined' || !selectedFee || typeof selectedFee.feeForTx === 'undefined') {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not selectedFee')
            return false
        }

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = this.props.account


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
            <CheckData
                name={'Miner fee'}
                value={`${prettyFee} ${prettyFeeSymbol}`}
                subvalue={fiatFee}
            />
        )
    }

}