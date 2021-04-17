import { createSelector } from 'reselect'

export const getIsLoaderVisible = createSelector(
  [state => state.mainStore.loaderVisibility],
  (data => data)
)

export const getIsBlurVisible = createSelector(
    [state => state.mainStore.blurVisibility],
    (data => data)
)
