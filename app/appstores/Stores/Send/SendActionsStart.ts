/**
 * @version 0.41
 */
import NavStore from '@app/components/navigation/NavStore'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransferUtils } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import { getFeeRate, SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'

import store from '@app/store'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import { setLoaderFromBse, setLoaderStatus } from '../Main/MainStoreActions'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import config from '@app/config/config'
import Log from '@app/services/Log/Log'

import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'

const { dispatch } = store

let CACHE_SEND_INPUT_TYPE = 'none'

const findWalletPlus = function(currencyCode: string): { wallet: any, cryptoCurrency: any, account: any } {

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

const formatDict = async function(cryptoCurrency : any, account : any) {
    const dict = {
        inputType : '',
        derivationPath : account.derivationPath,
        decimals : cryptoCurrency.decimals,
        extendsProcessor : cryptoCurrency.extendsProcessor,
        addressUiChecker : cryptoCurrency.addressUiChecker,
        network : cryptoCurrency.network,
        currencySymbol : cryptoCurrency.currencySymbol,
        currencyName : cryptoCurrency.currencyName,
        currencyRateScanTime : cryptoCurrency.currencyRateScanTime,
        walletHash : account.walletHash,
        accountId : account.accountId,
        addressFrom : account.address,
        currencyCode : account.currencyCode,
        balanceRaw : account.balanceRaw,
        balanceTotalPretty : account.balanceTotalPretty,
        basicCurrencyBalanceTotal : account.basicCurrencyBalanceTotal,
        basicCurrencySymbol : account.basicCurrencySymbol,
        basicCurrencyCode : account.basicCurrencyCode,
        basicCurrencyRate : account.basicCurrencyRate,
        feesBasicCurrencyRate : account.feeRates?.basicCurrencyRate || account.basicCurrencyRate,
        feesBasicCurrencySymbol : account.feeRates?.basicCurrencySymbol || account.basicCurrencySymbol,
        feesCurrencyCode : account.feesCurrencyCode,
        feesCurrencySymbol : account.feesCurrencySymbol
    }
    if (CACHE_SEND_INPUT_TYPE === 'none') {
        CACHE_SEND_INPUT_TYPE = trusteeAsyncStorage.getSendInputType() !== 'CRYPTO' ? 'FIAT' : 'CRYPTO'
    }
    dict.inputType = CACHE_SEND_INPUT_TYPE
    return dict
}

export namespace SendActionsStart {

    export const setBasicInputType = async (inputType : string) => {
        CACHE_SEND_INPUT_TYPE = inputType
        trusteeAsyncStorage.setSendInputType(inputType)
    }

    export const startFromWalletConnect = async (data : {
        currencyCode : string,
        walletConnectData : any,
        walletConnectPayload : any,
        extraData : any,
        transactionFilterType : any
    }, uiType = 'WALLET_CONNECT') => {
        try {
            Log.log('SendActionsStart.startFromWalletConnect data ', data)

            const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
            if (typeof account.derivationPath === 'undefined') {
                throw new Error('SendActionsStart.startFromWalletConnect required account.derivationPath')
            }
            if (typeof data.walletConnectData.value !== 'undefined' && data.walletConnectData.value && data.walletConnectData.value.toString().indexOf('0x') === 0) {
                data.walletConnectData.value = BlocksoftUtils.decimalToHexWalletConnect(data.walletConnectData.value)
            }
            const dict = await formatDict(cryptoCurrency, account)
            SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account)
            const ui = {
                uiType: uiType,
                cryptoValue: data.walletConnectData.value ? data.walletConnectData.value : 0,
                addressTo: data.walletConnectData.to,
                walletConnectData: data.walletConnectData,
                walletConnectPayload: data.walletConnectPayload,
                extraData: data.extraData,
                transactionFilterType: data.transactionFilterType || TransactionFilterTypeDict.WALLET_CONNECT
            }

            Log.log('SendActionsStart.startFromWalletConnect ui data ', ui)

            dispatch({
                type: 'RESET_DATA',
                ui,
                dict
            })

            await SendActionsBlockchainWrapper.getFeeRate(ui)
            if (uiType === 'TRADE_LIKE_WALLET_CONNECT') {
                setLoaderFromBse(false)
                NavStore.goNext('MarketReceiptScreen')
            } else {
                NavStore.goNext('ReceiptScreen')
            }
        } catch (e) {
            Log.err(' SendActionsStart.startFromWalletConnect error ' + e.message)
        }
    }

    export const startFromCustomContractCallData = async (data : {
        currencyCode : string,
        contractCallData: any
    }) => {
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = await formatDict(cryptoCurrency, account)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account)
        const ui =  {
            uiType : 'NFT_SCREEN',
            contractCallData : data.contractCallData,
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })
        NavStore.goNext('SendScreenWithoutAmount')
    }

    export const startFromAccountScreen = async (currencyCode : string, uiType = 'ACCOUNT_SCREEN') => {
        const { cryptoCurrency, account } = findWalletPlus(currencyCode)
        const dict = await formatDict(cryptoCurrency, account)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account)
        dispatch({
            type: 'RESET_DATA',
            ui: {
                uiType
            },
            dict
        })
        NavStore.goNext('SendScreen')
    }


    export const startFromHomeScreen = async (cryptoCurrency : any, account : any, uiType = 'HOME_SCREEN')  => {
        const dict = await formatDict(cryptoCurrency, account)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account)
        dispatch({
            type: 'RESET_DATA',
            ui: {
                uiType
            },
            dict
        })
        NavStore.goNext('SendScreen')
    }

    export const startFromDEX = async (data : {
        addressTo : string,
        amount : string,
        currencyCode : string,
        dexCurrencyCode: string,
        dexOrderData:
            {
                tokenContract: string,
                contractMethod: string,
                options: any,
            }
        }, bse : any) => {
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = await formatDict(cryptoCurrency, account)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account)
        const ui = {
            uiType : 'TRADE_SEND',
            cryptoValue : data.amount,
            addressTo : 'DEX ' + data.addressTo,
            dexCurrencyCode : data.dexCurrencyCode,
            dexOrderData : data.dexOrderData,
            bse,
            transactionFilterType: TransactionFilterTypeDict.SWAP
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })
        setLoaderFromBse(true)
        await SendActionsBlockchainWrapper.getFeeRate(ui)
        NavStore.goNext('MarketReceiptScreen')
    }

    export const getTransferAllBalanceFromBSE = async (data : {
        currencyCode : string,
        address : string,
        memo : string,
    }) => {
        // @ts-ignore
        const addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll(data)
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = await formatDict(cryptoCurrency, account)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : addressToForTransferAll,
            amount :  '0',
            memo : data.memo || false ,
        })
        const ui = {
            uiType : 'TRADE_SEND',
            addressTo : addressToForTransferAll,
            cryptoValue : '0',
            isTransferAll : true,
            memo : data.memo || false,
            transactionFilterType: TransactionFilterTypeDict.SWAP
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })
        const res = await SendActionsBlockchainWrapper.getTransferAllBalance()
        return res
    }

    export const startFromBSE = async (data : {
        amount : string,
        address : string,
        addressTo : string, // wtf now address in data - ok, but support old notation
        memo : string,
        comment : string,
        currencyCode : string,
        useAllFunds : boolean
    }, bse : {
        bseProviderType : any,
        bseOrderId: any,
        bseMinCrypto : any,
        bseTrusteeFee : any,
        bseOrderData : any,
        payway : any,
        forceExecAmount : boolean
    }, selectedFee : any) => {
        const addressTo = typeof data.addressTo !== 'undefined' ? data.addressTo : data.address
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = await formatDict(cryptoCurrency, account)
        const amount = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(data.amount)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo,
            amount : amount,
            memo : data.memo
        })
        const ui = {
            uiType : 'TRADE_SEND',
            addressTo,
            memo : data.memo,
            comment : data.comment || '',
            cryptoValue : amount,
            isTransferAll : data.useAllFunds,
            bse,
            transactionFilterType: TransactionFilterTypeDict.SWAP
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })
        setLoaderFromBse(true)
        await SendActionsBlockchainWrapper.getFeeRate(ui, selectedFee)
        NavStore.goNext('MarketReceiptScreen')
    }


    export const startFromTransactionScreenBoost = async (accountSelected : any, transaction : any) => {
        const { cryptoCurrency, account } = findWalletPlus(accountSelected.currencyCode)
        if (typeof account.derivationPath === 'undefined') {
            throw new Error('SendActionsStart.startFromTransactionScreenBoost required account.derivationPath')
        }
        const dict = await formatDict(cryptoCurrency, account)

        const ui = {
            uiType : 'TRANSACTION_SCREEN',
            cryptoValue : transaction.addressAmount,
            tbk : {
                transactionBoost: transaction,
                transactionAction: 'transactionReplaceByFee',
            },
            addressTo : transaction.addressTo,
            bse : {},
            comment : ''
        }
        if (transaction.transactionDirection === 'income') {
            ui.tbk.transactionAction = 'transactionSpeedUp'
            ui.addressTo = account.address
        } else {
            if (typeof transaction.bseOrderId !== 'undefined') {
                ui.bse.bseOrderId = transaction.bseOrderId
            }
            if (typeof transaction.transactionJson !== 'undefined' && transaction.transactionJson !== {} && transaction.transactionJson) {
                if (typeof transaction.transactionJson.bseMinCrypto !== 'undefined') {
                    ui.bse.bseMinCrypto = transaction.transactionJson.bseMinCrypto
                }
                if (transaction.transactionJson.comment !== 'undefined') {
                    ui.comment = transaction.transactionJson.comment
                }
            }
        }

        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : ui.addressTo,
            amount :  transaction.addressAmount,
            tbk : ui.tbk
        })
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })

        await SendActionsBlockchainWrapper.getFeeRate(ui)
        NavStore.goNext('ReceiptScreen')
    }

    export const startFromTransactionScreenRemove = async (accountSelected : any, transaction : any) => {
        const { cryptoCurrency, account } = findWalletPlus(accountSelected.currencyCode)
        if (typeof account.derivationPath === 'undefined') {
            throw new Error('SendActionsStart.startFromTransactionScreenBoost required account.derivationPath')
        }
        const dict = await formatDict(cryptoCurrency, account)

        const ui = {
            uiType : 'TRANSACTION_SCREEN',
            cryptoValue : transaction.addressAmount,
            tbk : {
                transactionBoost: transaction,
                transactionAction: 'transactionRemoveByFee',
            },
            addressTo : account.address,
            bse : {},
            comment : ''
        }
        if (typeof transaction.bseOrderId !== 'undefined') {
            ui.bse.bseOrderId = transaction.bseOrderId
        }
        if (typeof transaction.transactionJson !== 'undefined' && transaction.transactionJson && transaction.transactionJson !== {}) {
            if (typeof transaction.transactionJson.comment !== 'undefined' && transaction.transactionJson.comment) {
                ui.comment = transaction.transactionJson.comment
            }
        }
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : ui.addressTo,
            amount :  transaction.addressAmount,
            tbk : ui.tbk
        })
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })

        await SendActionsBlockchainWrapper.getFeeRate(ui)
        NavStore.goNext('ReceiptScreen')
    }

    export const startFromDeepLinking = async (data :{
        needToDisable?: boolean,
        address: string,
        amount: string | number,
        currencyCode: string,
        label: string
    }, uiType = 'DEEP_LINKING') => {
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = await formatDict(cryptoCurrency, account)
        const addressTo = data.address ? data.address : ''
        const amount = data.amount ? data.amount.toString() : '0'
        const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(amount)

        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : addressTo,
            amount :  amountRaw,
        })
        const ui = {
            uiType,
            addressTo : addressTo,
            comment : data.label || '',
            cryptoValue : amountRaw
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })

        if (typeof data.needToDisable !== 'undefined' && data.needToDisable
            && addressTo && addressTo !== ''
            && amount && amount !== '' && amount !== '0'
        ) {
            await SendActionsBlockchainWrapper.getFeeRate(ui)
            NavStore.goNext('ReceiptScreen')
        } else {
            NavStore.goNext('SendScreen')
        }
    }

    export const startFromQRCodeScanner = async (data : any, uiType = 'MAIN_SCANNER') => {
        return startFromDeepLinking(data, uiType)
    }

    export const startFromFioRequest = async (currencyCode : any,
        fioRequestDetails :  {
            // eslint-disable-next-line camelcase
            content: {amount: string, memo: string, payee_public_address: string},
            // eslint-disable-next-line camelcase
            fio_request_id: number,
            // eslint-disable-next-line camelcase
            payee_fio_address: string,
            // eslint-disable-next-line camelcase
            payee_fio_public_key: string,
            // eslint-disable-next-line camelcase
            payer_fio_address: string,
            // eslint-disable-next-line camelcase
            payer_fio_public_key: string,
            // eslint-disable-next-line camelcase
            time_stamp: string
        }) => {
        const { cryptoCurrency, account } = findWalletPlus(currencyCode)
        const dict = await formatDict(cryptoCurrency, account)

        const amount = fioRequestDetails.content.amount
        const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(amount)

        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo: fioRequestDetails.content.payee_public_address,
            amount: amountRaw,
        })
        const ui = {
            uiType: 'FIO_REQUEST',
            addressTo: fioRequestDetails.content.payee_public_address,
            addressName:  fioRequestDetails.payee_fio_address,
            comment: fioRequestDetails.content.memo,
            cryptoValue: amountRaw,
            fioRequestDetails
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })

        await SendActionsBlockchainWrapper.getFeeRate(ui)
        NavStore.goNext('ReceiptScreen')
    }

    export const getAccountFormatData = async (data : {
        currencyCode : string
    }) => {
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = await formatDict(cryptoCurrency, account)

        return { dict }
    }
}
