/**
 * @version 0.41
 */
import { createSelector } from 'reselect'

export const getSendScreenData = createSelector(
    [state => state.sendScreenStore],
    (data => data)
)
