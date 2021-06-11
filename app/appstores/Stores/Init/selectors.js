/**
 * @version 0.43
 */
import { createSelector } from 'reselect'

export const getInit = createSelector(
  [state => state.initStore.init],
  (data => data)
)

export const getInitError = createSelector(
    [state => state.initStore.initError],
    (data => data)
)
