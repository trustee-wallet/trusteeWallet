/**
 * @version 0.30
 */
import NavStore from '../../../components/navigation/NavStore'

import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import { BlocksoftTransfer } from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import { SendTmpData } from './SendTmpData'


import {
    isFioAddressValid,
    isFioAddressRegistered,
    resolveChainCode,
    getPubAddress
} from '../../../../crypto/blockchains/fio/FioUtils'

import config from '../../../config/config'
import store from '../../../store'
import { strings } from '../../../services/i18n'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import Log from '../../../services/Log/Log'
import { BlocksoftBlockchainTypes } from '../../../../crypto/blockchains/BlocksoftBlockchainTypes'

export namespace SendActions {

    export const getContactAddress = async function(data: { addressName: string, currencyCode: string }): Promise<string | boolean> {

        let isUiError = false
        let uiError = ''
        try {
            if (isFioAddressValid(data.addressName)) {
                Log.log('SendActions.getContactAddress isFioAddress checked ' + data.addressName)
                if (await isFioAddressRegistered(data.addressName)) {
                    Log.log('SendActions.getContactAddress isFioAddressRegistered checked ' + data.addressName)

                    const extend = BlocksoftDict.getCurrencyAllSettings(data.currencyCode)

                    const chainCode = resolveChainCode(data.currencyCode, extend.currencySymbol)
                    const publicFioAddress = await getPubAddress(data.addressName, chainCode, extend.currencySymbol)
                    Log.log('SendActions.getContactAddress public for ' + data.addressName + ' ' + chainCode + ' =>' + publicFioAddress)
                    if (!publicFioAddress || publicFioAddress === '0') {
                        uiError = strings('send.publicFioAddressNotFound', { symbol: data.currencyCode })
                        isUiError = true
                    } else {
                        return publicFioAddress
                    }
                } else {
                    Log.log('SendActions.getContactAddress isFioAddressRegistered no result ' + data.addressName)
                    uiError = strings('send.publicFioAddressNotFound', { symbol: data.currencyCode })
                    isUiError = true
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('SendActions.getContactAddress isFioAddress error ' + data.addressName + ' => ' + e.message)
            }
            Log.log('SendActions.getContactAddress isFioAddress error ' + data.addressName + ' => ' + e.message)
        }
        if (isUiError) {
            throw new Error(uiError)
        }
        return false
    }

    export const countTransferAllBeforeStartSend = async function(data: {
        addressTo: string,
        currencyCode: string,
        memo: string
    }): Promise<{ countedFees: any, transferBalance: string }> {

        const { wallet, account } = findWalletPlus(data.currencyCode)

        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee, walletUseLegacy, walletIsHd } = wallet
        const { address, currencyCode, derivationPath, accountJson } = account

        let balancesData = await (BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(address).setWalletHash(walletHash)).getBalance()
        if (typeof balancesData.balance === 'undefined' || !balancesData.balance) {
            balancesData = await (BlocksoftBalances.setCurrencyCode(currencyCode).setAddress(address).setWalletHash(walletHash)).getBalance()
        }

        const countedFeesData = {
            currencyCode: currencyCode,
            walletHash: walletHash,
            derivationPath: derivationPath,
            addressFrom: address,
            addressTo: data.addressTo,
            amount: balancesData ? balancesData.balance : 0,
            unconfirmed: balancesData ? balancesData.unconfirmed : 0,
            isTransferAll: true,
            useOnlyConfirmed: !(walletUseUnconfirmed === 1),
            allowReplaceByFee: walletAllowReplaceByFee === 1,
            useLegacy: walletUseLegacy,
            isHd: walletIsHd,
            accountJson
        }
        if (typeof data.memo !== 'undefined' && data.memo) {
            // @ts-ignore
            countedFeesData.memo = data.memo
        }
        const countedFees = await BlocksoftTransfer.getTransferAllBalance(countedFeesData)
        let selectedFee = false
        if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
            // @ts-ignore
            selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
        }
        SendTmpData.setCountedFees({ countedFees, countedFeesData, selectedFee })
        return { countedFees, transferBalance: countedFees.selectedTransferAllBalance }
    }

    export const countFees = async function(data: SendTmpData.SendScreenDataRequest): Promise<{ countedFees: any, selectedFee: any }> {

        const { wallet, account } = findWalletPlus(data.currencyCode)

        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee, walletUseLegacy, walletIsHd } = wallet
        const { address, currencyCode, derivationPath, accountJson } = account

        let amount = data.amountRaw || '0'
        if (typeof data.addressTo === 'undefined' || !data.addressTo || data.addressTo === '') {
            return {
                countedFees: false,
                selectedFee: false
            }
        }
        if (data.inputValue && !data.isTransferAll) {
            amount = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(data.inputValue)
        }

        // console.log('selectedFee', JSON.parse(JSON.stringify(data.selectedFee || 'none')))
        const countedFeesData = {
            currencyCode: currencyCode,
            walletHash: walletHash,
            derivationPath: derivationPath,
            addressFrom: address,
            addressTo: data.addressTo || '',
            amount,
            unconfirmed: data.unconfirmedRaw || '0',
            isTransferAll: data.isTransferAll || false,
            useOnlyConfirmed: !(walletUseUnconfirmed === 1),
            allowReplaceByFee: walletAllowReplaceByFee === 1,
            useLegacy: walletUseLegacy,
            isHd: walletIsHd,
            accountJson
        } as BlocksoftBlockchainTypes.TransferData
        if (typeof data.memo !== 'undefined' && data.memo) {
            // @ts-ignore
            countedFeesData.memo = data.memo
        }
        if (data.transactionSpeedUp || data.transactionReplaceByFee) {
            // any amount is ok
        } else if (amount === '0') {
            return {
                countedFees: false,
                selectedFee: false
            }

        }
        if (typeof data.transactionJson !== 'undefined' && data.transactionJson && data.transactionJson !== {}) {
            countedFeesData.transactionJson = data.transactionJson
        }

        const addData = {} as BlocksoftBlockchainTypes.TransferAdditionalData
        if (typeof data.selectedFee !== 'undefined' && data.selectedFee) {
            if (typeof data.selectedFee.blockchainData !== 'undefined' && typeof data.selectedFee.blockchainData.unspents !== 'undefined') {
                // @ts-ignore
                if (data.selectedFee.blockchainData.isTransferAll === countedFeesData.isTransferAll) {
                    // @ts-ignore
                    addData.unspents = data.selectedFee.blockchainData.unspents
                }
            }
        }

        let countedFees, selectedFee
        if (data.isTransferAll) {
            countedFees = await BlocksoftTransfer.getTransferAllBalance(countedFeesData, addData)
        } else {
            countedFees = await BlocksoftTransfer.getFeeRate(countedFeesData, addData)
        }

        let foundSelected = false
        if (typeof data.selectedFee !== 'undefined' && data.selectedFee && data.selectedFee.langMsg) {
            for (const fee of countedFees.fees) {
                if (fee.langMsg === data.selectedFee.langMsg) {
                    selectedFee = fee
                    foundSelected = true
                    break
                }
            }
        }
        if (typeof data.selectedFee !== 'undefined' && data.selectedFee && typeof data.selectedFee.isCustomFee !== 'undefined') {
            if (typeof data.selectedFee.feeForByte !== 'undefined' && data.selectedFee.feeForByte) {
                // @ts-ignore
                addData.feeForByte = data.selectedFee.feeForByte
            }

            let countedFees2
            if (data.isTransferAll) {
                countedFees2 = await BlocksoftTransfer.getTransferAllBalance(countedFeesData, addData)
            } else {
                countedFees2 = await BlocksoftTransfer.getFeeRate(countedFeesData, addData)
            }
            if (typeof countedFees2.fees !== 'undefined' && typeof countedFees2.fees[0] !== 'undefined') {
                selectedFee = countedFees2.fees[0]
                selectedFee.isCustomFee = true
                foundSelected = true
            }
        }

        if (!foundSelected && typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
            selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
        }
        SendTmpData.setCountedFees({ countedFees, countedFeesData, selectedFee })

        return { countedFees, selectedFee }
    }

    export const startSend = async function(data: SendTmpData.SendScreenDataRequest): Promise<boolean> {

        let needToCount = false
        if (typeof data.uiType !== 'undefined' && data.uiType === 'TRADE_SEND') {
            if (!data.isTransferAll) {
                SendTmpData.cleanCountedFees()
                needToCount = true
            }
        } else if (typeof data.gotoWithCleanData !== 'undefined' && !data.gotoWithCleanData) {
            // do nothing for send => receipt
        } else {
            // for all others also clean
            SendTmpData.cleanCountedFees()
            needToCount = true
        }

        data.transactionReplaceByFee = false
        data.transactionSpeedUp = false
        data.transactionJson = {}
        if (typeof data.transactionBoost !== 'undefined' && data.transactionBoost && typeof data.transactionBoost.transactionHash !== 'undefined') {
            data.currencyCode = data.transactionBoost.currencyCode
            if (data.transactionBoost.transactionDirection !== 'income') {
                data.transactionJson = data.transactionBoost.transactionJson
                data.transactionReplaceByFee = data.transactionBoost.transactionHash
            } else {
                data.transactionSpeedUp = data.transactionBoost.transactionHash
            }
        }

        if (typeof data.amountPretty !== 'undefined') {
            if (typeof data.amountRaw === 'undefined') {
                data.amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(data.amountPretty)
            }
        } else if (typeof data.amountRaw !== 'undefined') {
            data.amountPretty = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makePretty(data.amountRaw)
        }
        if (typeof data.fioRequestDetails !== 'undefined' && typeof data.fioRequestDetails.content !== 'undefined' && typeof data.fioRequestDetails.content.amount !== 'undefined') {
            data.amountPretty = data.fioRequestDetails.content.amount as string
            data.amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(data.amountPretty)
            data.contactName = data.fioRequestDetails.payee_fio_address
            data.addressTo = data.fioRequestDetails.content.payee_public_address || data.fioRequestDetails.payee_fio_public_key
        }

        data.uiNeedToCountFees = (data.gotoReceipt && needToCount)

        SendTmpData.setData(data)
        if (data.gotoReceipt) {
            /*if (needToCount) {
                const { selectedFee } = await countFees(data)
                data.selectedFee = selectedFee
                SendTmpData.setData(data)
            }*/
            NavStore.goNext('ReceiptScreen', { fioRequestDetails: data.fioRequestDetails })
        } else {
            NavStore.goNext('SendScreen')
        }
        return true
    }


    export const findWalletPlus = function(currencyCode: string): { wallet: any, cryptoCurrency: any, account: any } {

        // @todo cache separate
        const { selectedWallet } = store.getState().mainStore
        const { cryptoCurrencies } = store.getState().currencyStore
        const { accountList } = store.getState().accountStore

        let cryptoCurrency = { currencyCode: false }
        let account = false
        // @ts-ignore
        for (const tmp of cryptoCurrencies) {
            if (tmp.currencyCode === currencyCode) {
                cryptoCurrency = tmp
            }
        }
        if (cryptoCurrency.currencyCode) {
            // @ts-ignore
            account = accountList[selectedWallet.walletHash][cryptoCurrency.currencyCode]
        }
        return { wallet: selectedWallet, cryptoCurrency, account }

    }
}