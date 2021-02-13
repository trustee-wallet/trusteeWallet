
import { createSelector } from 'reselect'
import _isEqual from 'lodash/isEqual'


export const getIsBalanceVisible = createSelector(
  [state => state.data],
  (data => data.isBalanceVisible)
)