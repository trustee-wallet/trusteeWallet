/**
 * @version 0.50
 */

const INITIAL_STATE = {
    customAssets: {},
    loaded : false
}

const nftCustomAssetsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_NFT_CUSTOM_ASSETS_LOADED':
            return {
                ...state,
                customAssets: action.customAssets || state.customAssets,
                loaded : action.loaded || state.loaded
            }
        default:
            return state
    }
}

export default nftCustomAssetsStoreReducer
