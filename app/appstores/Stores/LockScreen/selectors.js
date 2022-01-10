/**
 * @version 0.45
 */
import { createSelector } from 'reselect'
export const getLockScreenData = createSelector(
    [state => state.lockScreenStore],
    (data => {
        return {
            flowType: data.flowType,
            callback : data.callback,
            noCallback: data.noCallback
        }
    })
)
