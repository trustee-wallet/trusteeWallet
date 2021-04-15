/**
 * @version 0.42
 */
import { createSelector } from 'reselect'
export const getLockScreenData = createSelector(
    [state => state.lockScreenStore],
    (data => data)
)
