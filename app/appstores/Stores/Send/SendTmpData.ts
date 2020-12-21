import { BlocksoftBlockchainTypes } from '../../../../crypto/blockchains/BlocksoftBlockchainTypes'

export namespace SendTmpData {

    export interface SendScreenDataRequest  {
        gotoReceipt ?: boolean
        gotoWithCleanData ?: boolean,
        uiType ?: 'MAIN_SCANNER' | 'HOME_SCREEN' | 'SEND_SCANNER' | 'TRADE_SEND' | 'DEEP_LINKING' | 'ACCOUNT_SCREEN' | 'FIO_REQUESTS' | 'TRANSACTION_SCREEN', // from where
        uiApiVersion ?: 'v2' | 'v3', // for trades version of api
        uiProviderType ?: 'FIXED' | 'FLOATING', // for trades types
        uiNeedToCountFees ?: boolean,
        uiInputType ?: 'FIAT' | 'CRYPTO' | 'any',

        // this is actually for redo
        inputValue ?: string, // 0.1
        selectedFee ?: any, // ?


        addressTo : string,
        amountPretty ?: string, // 0.1
        amountRaw ?: string, // 0010000
        unconfirmedRaw ?: string, // 01231

        currencyCode : string,
        isTransferAll ?: boolean, // false
        comment ?: string, // user memo
        memo ?: string, // blockchain memo

        contactName?: boolean | string,
        contactAddress ?: boolean | string,

        fioRequestDetails ?: any,

        bseOrderId ?: string,
        bseOrderData ?: any,

        transactionJson : any,

        transactionReplaceByFee : string | boolean,
        transactionSpeedUp : string | boolean,

        transactionBoost ?: {
            currencyCode : string,
            transactionHash : string,
            transactionJson : any,
            transactionDirection : 'income' | 'outcome' | 'self'
        }
    }

    let CACHE_REQUEST = {} as SendScreenDataRequest
    export const setData = function(data : SendScreenDataRequest) : void {
        CACHE_REQUEST = data
    }
    export const getData = function() : SendScreenDataRequest {
        return CACHE_REQUEST
    }

    let CACHE_COUNTED_FEES = {} as BlocksoftBlockchainTypes.FeeRateResult
    let CACHE_COUNTED_FEES_DATA = false
    let CACHE_SELECTED_FEE = false
    export const setCountedFees = function (data : {countedFees : BlocksoftBlockchainTypes.FeeRateResult , countedFeesData : any, selectedFee : any}) : void {
        CACHE_COUNTED_FEES = data.countedFees
        CACHE_COUNTED_FEES_DATA = data.countedFeesData
        CACHE_SELECTED_FEE = data.selectedFee
    }
    export const cleanCountedFees = function() : void {
        CACHE_COUNTED_FEES = {} as BlocksoftBlockchainTypes.FeeRateResult
        CACHE_COUNTED_FEES_DATA = false
        CACHE_SELECTED_FEE = false
    }
    export const getCountedFees = function() : {countedFees : BlocksoftBlockchainTypes.FeeRateResult , countedFeesData : any, selectedFee : any} {
        return {
            countedFees : CACHE_COUNTED_FEES,
            countedFeesData : CACHE_COUNTED_FEES_DATA,
            selectedFee : CACHE_SELECTED_FEE
        }
    }
    export const setSelectedFee = function(selectedFee : any) : void {
        CACHE_SELECTED_FEE = selectedFee
    }

    export const setComment = function(comment : string) : void {
        CACHE_REQUEST.comment = comment
    }
}