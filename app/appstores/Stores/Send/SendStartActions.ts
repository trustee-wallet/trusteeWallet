export namespace SendStartActions {
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

    export const startFromQRCodeScanner = async (parsed : any, cryptoCurrency : any, uiType = 'MAIN_SCANNER') => {
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

    export const startFromAccountScreen = async (cryptoCurrency : any, account : {
        currencyCode : string
    }) => {
        /*
         await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType: 'ACCOUNT_SCREEN'
                }
            })
            await SendActions.startSend({
                currencyCode : account.currencyCode,
            })
         */
    }

    export const startFromHomeScreen = async (cryptoCurrency : any, account : {
        currencyCode : string
    })  => {
        /*
        await SendActions.cleanData()
        SendActions.setUiType({
            ui: {
                uiType: 'HOME_SCREEN'
            }
        })
        await SendActions.startSend({
            currencyCode: cryptoCurrency.currencyCode
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

    export const startFromFioRequest = async (currencyCode, fioRequestDetails) => {
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
