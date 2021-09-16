/**
 * @version 0.50
 */
import { createSelector } from 'reselect'

export const getNftCustomAssetsData = createSelector(
    [state => state.nftCustomAssetsStore],
    (data => {
        return {
            customAssets: data.customAssets || {},
            loaded : data.loaded || false
        }
    })
)
