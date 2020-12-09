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
import { Keyboard } from 'react-native'
import SendTmpConstants from './elements/SendTmpConstants'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import UpdateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'
import updateTradeOrdersDaemon from '../../daemons/back/UpdateTradeOrdersDaemon'

export default class SendBasicScreen extends Component {


    recountFees = async (params) => {
        // console.log('SendBasicScreen.recountFees init ')
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
                // console.log('SendBasicScreen.recountFees amountRaw ' + txData.amount)
            }
            if (typeof params.addressTo !== 'undefined') {
                txData.addressTo = params.addressTo
                // console.log('SendBasicScreen.recountFees addressTo ' + txData.addressTo)
            }

            // console.log('SendBasicScreen.recountFees txData ', JSON.parse(JSON.stringify(txData)))
            countedFees = await BlocksoftTransfer.getFeeRate(txData)
            countedFees.feesCountedForData = txData
            let foundSelected = false
            if (this.state.selectedFee && this.state.selectedFee.langMsg) {
                for (const fee of countedFees.fees) {
                    if (fee.langMsg === this.state.selectedFee.langMsg) {
                        selectedFee = fee
                        foundSelected = true
                        break
                    }
                }
            }
            if (!foundSelected && typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >=0) {
                selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            }

            if (this._screenName === 'Receipt') {
                SendTmpConstants.PRESET_FROM_RECEIPT = true
                SendTmpConstants.COUNTED_FEES = countedFees
                SendTmpConstants.SELECTED_FEE = selectedFee
            }

            // console.log('SendBasicScreen.recountFees result ', JSON.parse(JSON.stringify(countedFees)))
        } catch (e) {
            if (config.debug.appErrors) {
                // console.log('SendBasicScreen.recountFees', e)
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

    openAdvancedSettings = async () => {

        const { countedFees, selectedFee, useAllFunds } = this.state

        // const countedFees = SendTmpConstants.COUNTED_FEES
        // const selectedFee = SendTmpConstants.

        // console.log('Send.SendBasicScreen.openAdvancedSettings state', JSON.parse(JSON.stringify({countedFees,selectedFee,useAllFunds})))

        let account
        if (typeof this.state.data !== 'undefined' && this.state.data && typeof this.state.data.account !== 'undefined') {
            account = this.state.data.account
        } else {
            account = this.props.account
        }
        SendTmpConstants.ACCOUNT_DATA = account

        if (Object.keys(countedFees).length === 0) {
            setLoaderStatus(true)
            setTimeout(() => {
                try {
                    // setLoaderStatus(true)
                    this.openAdvancedSettings()
                } catch (e) {
                }
            }, 100)
        } else {
            setLoaderStatus(false)
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

    closeAction = async () => {

        const { data } = this.state
        if (typeof data !== 'undefined' && data && typeof data.toTransactionJSON !== 'undefined' && data.toTransactionJSON && data.toTransactionJSON.bseOrderID !== 'undefined') {
            const version = data.apiVersion || 'v3'
            const removeId = this.state.data.toTransactionJSON.bseOrderID
            if (version === 'v2') {
                Api.setExchangeStatus(removeId, 'close')
            } else {
                ApiV3.setExchangeStatus(removeId, 'close')
            }
            UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({force: true, removeId, source: 'CANCEL'})
        }
        console.log('goBack')

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

        const { useAllFunds } = this.state

        let selectedFee = SendTmpConstants.SELECTED_FEE
        if (!selectedFee) {
            selectedFee = this.state.selectedFee
        }

        Log.log('Send.SendBasicScreen.renderMinerFee state', JSON.parse(JSON.stringify({ selectedFee, useAllFunds, onlyUseAllFunds })))

        if (onlyUseAllFunds && !useAllFunds) {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not useAllFunds')
            return false
        }
        if (typeof selectedFee === 'undefined' || !selectedFee || typeof selectedFee.feeForTx === 'undefined') {
            Log.log('Send.SendBasicScreen.renderMinerFee not shown as not selectedFee')
            return false
        }

        let account
        if (typeof this.state.data !== 'undefined' && this.state.data && typeof this.state.data.account !== 'undefined') {
            account = this.state.data.account
        } else {
            account = this.props.account
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