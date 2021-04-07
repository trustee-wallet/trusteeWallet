/**
 * @version 0.42
 */
import { createSelector } from 'reselect'
export const getCashBackData = createSelector(
    [state => state.cashBackStore],
    (data => data)
)
