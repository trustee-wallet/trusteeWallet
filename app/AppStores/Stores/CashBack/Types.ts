export const SET_CASH_BACK_API_DATA = 'SET_CASH_BACK_API_DATA'
export const SET_CASH_BACK_TOKEN = 'SET_CASH_BACK_TOKEN'
export const SET_CASH_BACK_PARENT_TOKEN = 'SET_CASH_BACK_PARENT_TOKEN'

export interface CashBackApiData {
    cashBackBalance: number,
    level2: boolean,
    level2Users: number,
    weeklyVolume: number,
    overallVolume: number,
    invitedUsers: number,
    cashBackLink: string
}

export interface CashBackState {
    cashBackParentToken: string,
    cashBackToken: string,
    cashBackLinkPrefix: string,
    cashBackApiData: CashBackApiData
}

interface SetCashBackApiData {
    type: typeof SET_CASH_BACK_API_DATA,
    payload: CashBackApiData
}

interface SetCashBackToken {
    type: typeof SET_CASH_BACK_TOKEN,
    payload: {
        cashBackToken: string
    }
}

interface SetCashBackParentToken {
    type: typeof SET_CASH_BACK_PARENT_TOKEN,
    payload: {
        cashBackParentToken: string
    }
}

export type CashBackActionTypes = SetCashBackApiData | SetCashBackToken | SetCashBackParentToken