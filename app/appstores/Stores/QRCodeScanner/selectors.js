/**
 * @version 0.43
 */
import { createSelector } from 'reselect'
export const getQrCodeScannerConfig = createSelector(
    [state => state.qrCodeScannerStore.config],
    (data => data)
)
