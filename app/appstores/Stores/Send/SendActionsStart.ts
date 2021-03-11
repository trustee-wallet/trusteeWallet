/**
 * @version 0.41
 */
import NavStore from '@app/components/navigation/NavStore'

import AsyncStorage from '@react-native-community/async-storage'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'

import store from '@app/store'
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

export namespace SendActionsStart {

    export const setBasicInputType = async (inputType : string) => {
        CACHE_SEND_INPUT_TYPE = inputType
        AsyncStorage.setItem('sendInputType', inputType)
    }

    export const startFromAccountScreen = async (cryptoCurrency : any, account : any, uiType = 'ACCOUNT_SCREEN') => {
        if (CACHE_SEND_INPUT_TYPE === 'none') {
            CACHE_SEND_INPUT_TYPE = (await AsyncStorage.getItem('sendInputType') !== 'CRYPTO') ? 'FIAT' : 'CRYPTO'
        }
        const dict = {
            inputType : CACHE_SEND_INPUT_TYPE,
            decimals : cryptoCurrency.decimals,
            extendsProcessor : cryptoCurrency.extendsProcessor,
            addressUiChecker : cryptoCurrency.addressUiChecker,
            network : cryptoCurrency.network,
            currencySymbol : cryptoCurrency.currencySymbol,
            currencyName : cryptoCurrency.currencyName,
            walletHash : account.walletHash,
            addressFrom : account.address,
            currencyCode : account.currencyCode,
            balanceRaw : account.balanceRaw,
            balanceTotalPretty : account.balanceTotalPretty,
            basicCurrencyBalanceTotal : account.basicCurrencyBalanceTotal,
            basicCurrencySymbol : account.basicCurrencySymbol,
            basicCurrencyCode : account.basicCurrencyCode,
            basicCurrencyRate : account.basicCurrencyRate
        }
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account)
        dispatch({
            type: 'RESET_DATA',
            ui: {
                uiType,
                addressTo : 'bnb146lec0enyzz2x5kpna8kwelky8kumfhj05aspz',
                memo : 'fgfxg',
                cryptoValue : '0.001'
            },
            dict
        })
        NavStore.goNext('SendScreen')
    }


    export const startFromHomeScreen = async (cryptoCurrency : any, account : any)  => {
        return startFromAccountScreen(cryptoCurrency, account, 'HOME_SCREEN')
    }

    export const startFromBSE = (data : {
        amount : string,
        addressTo : string,
        memo : string,
        comment : string,
        currencyCode : string,

        bseProviderType : any,
        bseOrderId: any,
        bseMinCrypto : any,
        bseTrusteeFee : any,
        bseOrderData : any

    }) => {
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = {
            inputType : '',
            decimals : cryptoCurrency.decimals,
            extendsProcessor : cryptoCurrency.extendsProcessor,
            addressUiChecker : cryptoCurrency.addressUiChecker,
            network : cryptoCurrency.network,
            currencySymbol : cryptoCurrency.currencySymbol,
            currencyName : cryptoCurrency.currencyName,
            walletHash : account.walletHash,
            addressFrom : account.address,
            currencyCode : account.currencyCode,
            balanceRaw : account.balanceRaw,
            balanceTotalPretty : account.balanceTotalPretty,
            basicCurrencyBalanceTotal : account.basicCurrencyBalanceTotal,
            basicCurrencySymbol : account.basicCurrencySymbol,
            basicCurrencyCode : account.basicCurrencyCode,
            basicCurrencyRate : account.basicCurrencyRate
        }
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : data.addressTo,
            amount :  data.amount,
            memo : data.memo
        })
        dispatch({
            type: 'RESET_DATA',
            ui: {
                uiType : 'TRADE_SEND',
                addressTo : data.addressTo,
                memo : data.memo,
                comment : data.comment,
                cryptoValue : data.amount
            },
            dict
        })
        NavStore.goNext('ReceiptScreen')
    }



    export const startFromDeepLinking = async (data :{
        needToDisable?: boolean,
        address: string,
        amount: string | number,
        currencyCode: string,
        label: string
    }) => {
        /*
            await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType: 'DEEP_LINKING'
                },
                addData: {
                    gotoReceipt: typeof parsed.needToDisable !== 'undefined' && !!(+parsed.needToDisable),
                    uiInputAddress: typeof parsed.address !== 'undefined' && parsed.address && parsed.address !== '',
                    comment: parsed.label || ''
                }
            })
            await SendActions.startSend({
                addressTo: parsed.address,
                amountPretty: parsed.amount ? parsed.toString() : '0',
                currencyCode: parsed.currencyCode
            })
         */
    }

    export const startFromQRCodeScanner = async (parsed : any, uiType = 'MAIN_SCANNER') => {
        /*
                        await SendActions.cleanData()
                SendActions.setUiType({
                    ui: {
                        uiType: 'MAIN_SCANNER',
                        uiInputType: parsed.amount ? 'CRYPTO' : 'any',
                        uiInputAddress: typeof parsed.address !== 'undefined' && parsed.address && parsed.address !== ''
                    },
                    addData: {
                        gotoReceipt: typeof parsed.needToDisable !== 'undefined' && !!(+parsed.needToDisable),
                        comment: parsed.label
                    }
                })
                await SendActions.startSend({
                    addressTo: parsed.address,
                    amountPretty: parsed.amount ? parsed.amount.toString() : 'old',
                    currencyCode: parsed.currencyCode,
                })
         */

        /*
                            await SendActions.cleanData()
                    SendActions.setUiType({
                        ui: {
                            uiType: 'SEND_SCANNER',
                            uiInputType: parsed.amount ? 'CRYPTO' : 'any',
                            uiInputAddress: typeof parsed.address !== 'undefined' && parsed.address && parsed.address !== ''
                        },
                        addData: {
                            gotoReceipt: typeof parsed.needToDisable !== 'undefined' && !!(+parsed.needToDisable),
                            comment: parsed.label
                        }
                    })
                    await SendActions.startSend({
                        addressTo: parsed.address,
                        amountPretty: parsed.amount ? parsed.amount.toString() : 'old',
                        currencyCode: parsed.currencyCode,
                    })
         */
    }

    export const startFromTransactionScreenRemove = async (account : any, transaction : any) => {
        /*
                    await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType : 'TRANSACTION_SCREEN_REMOVE'
                },
                addData: {
                    gotoReceipt: true,
                }
            })
            await SendActions.startSend({
                addressTo : account.address,
                amountRaw : transaction.addressAmount,
                transactionRemoveByFee : transaction.transactionHash,
                transactionBoost : transaction
            })
         */
    }

    export const startFromTransactionScreenBoost = async (account : any, transaction : any) => {
        /*

                    const params = {
                amountRaw : transaction.addressAmount,
                transactionBoost : transaction
            }
            if (transaction.transactionDirection === 'income') {
                params.transactionSpeedUp = transaction.transactionHash
                params.addressTo = account.address
            } else {
                params.transactionReplaceByFee = transaction.transactionHash
                params.addressTo = transaction.addressTo
            }
            await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType : 'TRANSACTION_SCREEN'
                },
                addData: {
                    gotoReceipt: true,
                }
            })
         */
    }

    export const startFromFioRequest = async (currencyCode : any, fioRequestDetails : any) => {
        /*
                    await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType : 'FIO_REQUESTS'
                },
                addData: {
                    gotoReceipt : true,
                }
            })
            await SendActions.startSend({
                fioRequestDetails : this.state.requestDetailData,
                currencyCode : currency.currencyCode,
            })
         */
    }
}
