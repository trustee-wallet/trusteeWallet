/**
 * @version 0.45
 */
import { createSelector } from 'reselect'
export const getQrCodeScannerConfig = createSelector(
    [state => state.qrCodeScannerStore],
    (data => {
        return {
            flowType: data.flowType,
            currencyCode : data.currencyCode,
            callback : data.callback
        }
    })
)
