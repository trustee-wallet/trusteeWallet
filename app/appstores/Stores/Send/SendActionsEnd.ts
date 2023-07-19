/**
 * @version 2.0
 */
import analytics from '@react-native-firebase/analytics'

import NavStore from '@app/components/navigation/NavStore'
import { setBseLink } from '@app/appstores/Stores/Main/MainStoreActions'
import store from '@app/store'
import Log from '@app/services/Log/Log'

import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import config from '@app/config/config'
import ApiRates from '@app/services/Api/ApiRates'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import transactionActions from '@app/appstores/Actions/TransactionActions'

import ApiV3 from '@app/services/Api/ApiV3'
import { recordFioObtData } from '@crypto/blockchains/fio/FioUtils'

import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'
import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'

const logFio = async function(transaction: any, tx: any, logData: any, sendScreenStore: any) {
    const { fioRequestDetails } = sendScreenStore.ui

    if (typeof fioRequestDetails === 'undefined' || !fioRequestDetails) return

    await recordFioObtData({
        fioRequestId: fioRequestDetails.fio_request_id,
        payerFioAddress: fioRequestDetails.payer_fio_address,
        payeeFioAddress: fioRequestDetails.payee_fio_address,
        payerTokenPublicAddress: transaction.addressFromBasic,
        payeeTokenPublicAddress: transaction.addressToBasic,
        amount: transaction.addressAmount,
        chainCode: transaction.currencyCode,
        tokenCode: transaction.currencyCode,
        obtId: transaction.transactionHash,
        memo: fioRequestDetails.content.memo
    })
}

const logSendSell = async function(transaction: any, tx: any, logData: any, sendScreenStore: any) {
    const { bseOrderId, bseTrusteeFee, bseOrderData } = sendScreenStore.ui.bse

    if (typeof bseOrderId === 'undefined' || !bseOrderId) return

    transaction.bseOrderId = bseOrderId
    transaction.bseOrderIdOut = bseOrderId
    if (typeof bseOrderData !== 'undefined' && bseOrderData) {
        transaction.bseOrderData = bseOrderData
    }
    logData.bseOrderId = bseOrderId.toString()

    const params = {
        transactionHash: transaction.transactionHash,
        orderHash: bseOrderId,
        status: 'SUCCESS'
    }
    ApiV3.setExchangeStatus(params)


    // https://rnfirebase.io/reference/analytics#logPurchase
    let usdValue = bseTrusteeFee.value
    let localCurrency = bseTrusteeFee.currencyCode.toLowerCase()
    let usdCurrency = 'usd'
    Log.log('sendScreenData.bseTrusteeFee in ' + localCurrency + ' ' + usdValue, bseTrusteeFee)
    let rate = false
    try {
        if (usdValue * 1 > 0 && localCurrency) {
            if (localCurrency !== 'usd') {
                rate = ApiRates.getRatesWithLocal()
                if (typeof rate !== 'undefined' && rate) {
                    if (localCurrency.indexOf('usdt') !== -1) {
                        usdValue = typeof rate.usdttousd !== 'undefined' && rate.usdttousd > 0 ? BlocksoftUtils.mul(rate.usdttousd, usdValue) : usdValue
                        Log.log('sendScreenData.bseTrusteeFee rate1 ' + rate.usdttousd + ' => ' + usdValue)
                    } else if (typeof rate['usdto' + localCurrency] !== 'undefined') {
                        usdValue = BlocksoftUtils.div(usdValue, rate['usdto' + localCurrency])
                        Log.log('sendScreenData.bseTrusteeFee rate2 ' + rate['usdto' + localCurrency] + ' => ' + usdValue)
                    } else if (typeof rate[localCurrency] !== 'undefined') {
                        usdValue = BlocksoftUtils.div(usdValue, rate[localCurrency])
                        Log.log('sendScreenData.bseTrusteeFee rate3 ' + rate[localCurrency] + ' => ' + usdValue)
                    } else {
                        Log.log('sendScreenData.bseTrusteeFee rate4 not found ' + localCurrency)
                        usdCurrency = 'uah'
                    }
                }
            }
        }
    } catch (e) {
        e.message += ' while usdValue calculation ' + localCurrency + ' ' + JSON.stringify(rate)
        throw e
    }
    let gaParams = {}
    try {
        gaParams = {
            value: usdValue * 1,
            currency: usdCurrency,
            items: [{
                item_brand: bseTrusteeFee.type,
                item_category: bseTrusteeFee.from,
                item_category2: bseTrusteeFee.to,
                item_id: bseOrderId,
                item_name: bseTrusteeFee.from + '_' + bseTrusteeFee.to,
                quantity: transaction.addressAmount * 1
            }]
        }
        const gaParamsStr = JSON.stringify(gaParams)

        await MarketingEvent.logEvent('v20_sell_to_card', gaParamsStr, 'SELL')
        await Log.log('v20_sell_to_card', gaParamsStr)
        await analytics().logAddToCart(gaParams)
    } catch (e) {
        if (config.debug.appErrors) {
            console.log('v20_sell_tx error ' + e.message, gaParams)
        }
        await Log.err('v20_sell_tx error ' + e.message)
    }

}

export namespace SendActionsEnd {

    export const endRedirect = async (tx: any, sendScreenStore: any) => {
        const { currencyCode } = sendScreenStore.dict
        const { uiType, tbk, walletConnectPayload } = sendScreenStore.ui
        const { transactionAction } = tbk

        Log.log('SendActionsEnd.endRedirect start ', {transactionAction, uiType})
        if (typeof transactionAction !== 'undefined' && transactionAction !== '' && transactionAction) {
            NavStore.goNext('AccountTransactionScreen', {
                txData: {
                    transactionHash: tx.transactionHash,
                    toOpenAccountBack: true
                },
                source : 'SendActionsEnd.transactionAction'
            })
        } else if (uiType === 'MAIN_SCANNER') {
            NavStore.reset('HomeScreen')
        } else if (tx === false || uiType === 'DEEP_LINKING' || uiType === 'HOME_SCREEN') {
            // account was not opened before or no tx could be done
            const account = store.getState().mainStore.selectedAccount
            if (!account || account.currencyCode !== currencyCode) {
                NavStore.reset('HomeScreen')
            } else {
                NavStore.reset('AccountScreen')
            }
        } else if (uiType === 'SEND_SCANNER') {
            await NavStore.goBack()
            NavStore.goNext('AccountTransactionScreen', {
                txData: {
                    transactionHash: tx.transactionHash,
                    uiType
                },
                source : 'SendActionsEnd.sendScanner'
            })
        } else if (uiType === 'ACCOUNT_SCREEN' || uiType === 'NFT_SCREEN') {
            await NavStore.goBack()
            await NavStore.goBack()
            NavStore.goNext('AccountTransactionScreen', {
                txData: {
                    transactionHash: tx.transactionHash,
                    uiType
                },
                source : 'SendActionsEnd.AccountScreen'
            })
        } else if (uiType === 'TRADE_SEND') {
            setBseLink(null)
            NavStore.goNext('HomeScreen', { screen: 'AccountTransactionScreen', params: {
                txData: {
                    transactionHash: tx.transactionHash,
                    uiType
                },
                    source : 'SendActionsEnd.TradeSend'
            }})
        } else if (uiType === 'WALLET_CONNECT') {
            Log.log('SendActionsEnd.endRedirect walletConnect will get ' + tx.transactionHash)
            await walletConnectActions.approveRequest(walletConnectPayload, tx.transactionHash)
            NavStore.goNext('AccountTransactionScreen', {
                txData: {
                    transactionHash: tx.transactionHash,
                    uiType
                },
                source : 'SendActionsEnd.WalletConnect'
            })
        } else if (uiType === 'TRADE_LIKE_WALLET_CONNECT') {
            setBseLink(null)
            const params = {
                transactionHash: tx.transactionHash,
                nonce: tx?.transactionJson?.nonce
            }
            await endClose(sendScreenStore, params)
            NavStore.goBack()
        } else {
            // fio request etc - direct to receipt
            NavStore.goBack()
        }

    }

    export const endClose = async (sendScreenStore : any, params : any = false) => {
        const { bse, extraData, walletConnectPayload, uiType } = sendScreenStore.ui
        const { bseOrderId } = bse
        const data = { extraData, ...params, orderHash: bseOrderId, status: 'CLOSE' }
        if (uiType === 'WALLET_CONNECT') {
            await walletConnectActions.rejectRequest(walletConnectPayload)
        }
        if (typeof bseOrderId === 'undefined' || !bseOrderId) return
        return ApiV3.setExchangeStatus(data)
    }

    export const saveTx = async (tx: any, sendScreenStore: any) => {
        const { currencyCode, accountId, walletHash, addressFrom } = sendScreenStore.dict
        const { addressTo, cryptoValue, memo, comment, bse, tbk, contractCallData, transactionFilterType, specialActionNeeded } = sendScreenStore.ui
        const { selectedFee, countedFees } = sendScreenStore.fromBlockchain
        const { bseMinCrypto } = bse
        const { transactionAction, transactionBoost } = tbk

        const now = new Date().toISOString()

        let value = cryptoValue
        if (typeof countedFees.amountForTx !== 'undefined') {
            value = countedFees.amountForTx
        } else if (typeof selectedFee.amountForTx !== 'undefined' ) {
            value = selectedFee.amountForTx
        }

        const logData = {
            walletHash: walletHash,
            currencyCode: currencyCode,
            transactionHash: tx.transactionHash,
            addressTo: addressTo,
            addressFrom: addressFrom,
            addressAmount: value,
            fee: JSON.stringify(selectedFee)
        }

        let transactionJson = {}
        if (memo) {
            transactionJson.memo = memo
        }
        if (comment) {
            transactionJson.comment = comment
        }
        if (typeof bseMinCrypto !== 'undefined' && bseMinCrypto) {
            transactionJson.bseMinCrypto = bseMinCrypto
            logData.bseMinCrypto = bseMinCrypto.toString()
        }
        if (typeof contractCallData !== 'undefined' && contractCallData) {
            transactionJson.contractCallData = contractCallData
            logData.contractCallData = contractCallData
        }
        if (typeof tx.transactionJson !== 'undefined') {
            let key
            for (key in tx.transactionJson) {
                transactionJson[key] = tx.transactionJson[key]
            }
        }

        let txRBF = false
        let txRBFed = ''
        if (typeof transactionAction !== 'undefined' && transactionAction && transactionAction !== '') {
            if (transactionAction === 'transactionRemoveByFee') {
                txRBF = transactionBoost.transactionHash
                txRBFed = 'RBFremoved'
                // @ts-ignore
                logData.transactionRemoveByFee = transactionBoost.transactionHash
            } else if (transactionAction === 'transactionReplaceByFee') {
                txRBF = transactionBoost.transactionHash
                txRBFed = 'RBFed'
                // @ts-ignore
                logData.transactionReplaceByFee = transactionBoost.transactionHash
            } else if (transactionAction === 'transactionSpeedUp') {
                // @ts-ignore
                txRBFed = 'SpeedUp ' + transactionBoost.transactionHash
                logData.transactionSpeedUp = transactionBoost.transactionHash
            } else {
                throw new Error('undefined SendActionsEnd saveTx transactionAction ' + transactionAction)
            }
        }

        if (txRBF) {
            const transaction = {
                currencyCode: currencyCode,
                accountId: accountId,
                transactionHash: tx.transactionHash,
                transactionStatus: 'new',
                addressTo: addressTo,
                addressToBasic: addressTo,
                addressFrom: '',
                addressFromBasic: addressFrom,
                addressAmount: typeof tx.amountForTx !== 'undefined' ? tx.amountForTx : cryptoValue,
                transactionFee: tx.transactionFee || '',
                transactionFeeCurrencyCode: tx.transactionFeeCurrencyCode || '',
                transactionOfTrusteeWallet: 1,
                transactionJson,
                blockConfirmations: 0,
                updatedAt: now,
                transactionDirection: addressTo === addressFrom ? 'self' : 'outcome',
                transactionFilterType: transactionFilterType || TransactionFilterTypeDict.USUAL,
                transactionUpdateHash: txRBF,
                transactionsOtherHashes: txRBF,
                transactionsScanLog: now + ' ' + txRBFed + ' ' + txRBF + ' => ' + tx.transactionHash + ' '
            }
            transaction.transactionJson.isRbfTime = new Date().getTime()
            if (txRBFed === 'RBFremoved') {
                transaction.addressTo = ''
                transaction.addressToBasic = addressFrom
                transaction.transactionDirection = 'self'
                transaction.transactionJson.isRbfType = 'remove'
            } else {
                transaction.transactionJson.isRbfType = 'replace'
            }
            await transactionActions.updateTransaction(transaction)
        } else {

            const transaction = {
                currencyCode: currencyCode,
                accountId: accountId,
                walletHash: walletHash,
                transactionHash: tx.transactionHash,
                transactionStatus: 'new',
                addressTo: addressTo,
                addressToBasic: addressTo,
                addressFrom: '',
                addressFromBasic: addressFrom,
                addressAmount: typeof tx.amountForTx !== 'undefined' ? tx.amountForTx : cryptoValue,
                transactionFee: tx.transactionFee || '',
                transactionFeeCurrencyCode: tx.transactionFeeCurrencyCode || '',
                transactionOfTrusteeWallet: 1,
                transactionJson,
                blockConfirmations: 0,
                createdAt: now,
                updatedAt: now,
                transactionFilterType: transactionFilterType || TransactionFilterTypeDict.USUAL,
                transactionDirection: addressTo === addressFrom ? 'self' : 'outcome',
                transactionsScanLog: now + ' CREATED ' + txRBFed,
            }
            if (typeof tx.amountForTx !== 'undefined') {
                transaction.addressAmount = tx.amountForTx
            }
            if (typeof tx.blockHash !== 'undefined') {
                transaction.blockHash = tx.blockHash
            }
            if (typeof tx.transactionStatus !== 'undefined') {
                transaction.transactionStatus = tx.transactionStatus
            }
            if (transaction.addressTo === addressFrom) {
                transaction.addressTo = ''
                transaction.transactionDirection = 'self'
            }
            if (typeof tx.transactionDirection !== 'undefined') {
                transaction.transactionDirection = tx.transactionDirection
            }
            if (typeof tx.transactionTimestamp !== 'undefined' && tx.transactionTimestamp) {
                transaction.createdAt = new Date(tx.transactionTimestamp).toISOString()
                transaction.updatedAt = new Date(tx.transactionTimestamp).toISOString()
            }
            if (typeof specialActionNeeded !== 'undefined' && specialActionNeeded) {
                transaction.specialActionNeeded = specialActionNeeded
            }


            try {
                await logSendSell(transaction, tx, logData, sendScreenStore)
            } catch (e) {
                Log.log('SendActionsEnd.logSendSell call error ' + e.message)
            }

            try {
                await logFio(transaction, tx, logData, sendScreenStore)
            } catch (e) {
                Log.log('SendActionsEnd.logFio call error ' + e.message)
            }

            try {
                const line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                // @ts-ignore
                await transactionActions.saveTransaction(transaction, line + ' HANDLE SEND ')
            } catch (e) {
                e.message += ' while transactionActions.saveTransaction'
                throw e
            }
        }
    }

}
