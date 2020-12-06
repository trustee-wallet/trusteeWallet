import React, { Component } from 'react'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'
import CheckData from './elements/CheckData'
import api from '../../services/Api/Api'
import NavStore from '../../components/navigation/NavStore'
import { strings } from '../../services/i18n'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'

export default class SendBasicScreen extends Component {

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
        const headerHeight = Math.round(height || 0);
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

        console.log('Send.SendBasicScreen.renderMinerFee state', JSON.parse(JSON.stringify({
            countedFees,
            selectedFee,
            useAllFunds
        })))

        if (!useAllFunds) {
            return null
        }
        if (typeof selectedFee === 'undefined' || !selectedFee || typeof selectedFee.feeForTx === 'undefined') {
            return null
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

        return (
            <CheckData
                name={'Miner fee'}
                value={`${prettyFee} ${prettyFeeSymbol}`}
                subvalue={fiatFee}
            />
        )
    }

}