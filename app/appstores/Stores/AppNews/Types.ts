export const FOUND_IN_TX = 'FOUND_IN_TX'
export const FOUND_OUT_TX_STATUS_NEW = 'FOUND_OUT_TX_STATUS_NEW'
export const FOUND_OUT_TX_STATUS_FAIL = 'FOUND_OUT_TX_STATUS_FAIL'
export const FOUND_OUT_TX_STATUS_MISSING = 'FOUND_OUT_TX_STATUS_MISSING'
export const FOUND_OUT_TX_STATUS_CONFIRMING = 'FOUND_OUT_TX_STATUS_CONFIRMING'
export const FOUND_OUT_TX_STATUS_SUCCESS = 'FOUND_OUT_TX_STATUS_SUCCESS'
export const FOUND_OUT_TX_STATUS_DELEGATED = 'FOUND_OUT_TX_STATUS_DELEGATED'

export type AppNewsJson = FoundInTxJson

export interface FoundInTxJson {
    transactionHash: string,
    currencyCode: string
}

export interface AppNewsItem {
    id: number,
    currencyCode : string | null,
    walletHash : string | null,
    walletName : string | null,
    newsCustomTitle: string | null,
    newsCustomText: string | null,
    newsName: typeof FOUND_IN_TX | typeof FOUND_OUT_TX_STATUS_NEW | typeof FOUND_OUT_TX_STATUS_FAIL | typeof FOUND_OUT_TX_STATUS_CONFIRMING | typeof FOUND_OUT_TX_STATUS_SUCCESS | typeof FOUND_OUT_TX_STATUS_DELEGATED | typeof FOUND_OUT_TX_STATUS_MISSING
    newsNeedPopup: number,
    newsJson: AppNewsJson,
    newsServerId : string
}
