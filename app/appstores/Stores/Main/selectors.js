import { createSelector } from 'reselect'

export const getIsLoaderVisible = createSelector(
  [state => state.mainStore.loaderVisibility],
  (data => data)
)
