import {
    CashBackActionTypes,
    CashBackApiData,
    SET_CASH_BACK_API_DATA,
    SET_CASH_BACK_TOKEN
} from './Types'

export function setCashBackApiData(newCashBackApiData: CashBackApiData): CashBackActionTypes {
    return {
        type: SET_CASH_BACK_API_DATA,
        payload: newCashBackApiData
    }
}

export function setCashBackToken(newCashBackToken: string): CashBackActionTypes {
    return {
        type: SET_CASH_BACK_TOKEN,
        payload: {
            cashBackToken: newCashBackToken
        }
    }
}

export function setCashBackParentToken(newCashBackParentToken: string): CashBackActionTypes {
    return {
        type: 'SET_CASH_BACK_PARENT_TOKEN',
        payload: {
            cashBackParentToken: newCashBackParentToken
        }
    }
}