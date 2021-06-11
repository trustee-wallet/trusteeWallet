/**
 * @version 0.42
 */
import { createSelector } from 'reselect'
export const getCashBackData = createSelector(
    [state => state.cashBackStore],
    (data => data)
)

export const getCashBackLinkFromDataAPi = createSelector(
    [state => state.cashBackStore.dataFromApi],
    (data => data)
)
