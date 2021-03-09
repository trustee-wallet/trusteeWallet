/**
 * @version 0.41
 */
import { createSelector } from 'reselect'

export const getSendScreenData = createSelector(
    [state => state.sendScreenStore],
    (data => data)
)

export const getSendScreenDataDict = createSelector(
    [state => state.sendScreenStore.dict],
    (data => data)
)
export const sendScreenStoreTransferAllBalance = createSelector(
    [state => state.sendScreenStore.fromBlockchain.transferAllBalance],
    (data => data)
)
