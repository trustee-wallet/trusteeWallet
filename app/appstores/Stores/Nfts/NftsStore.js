/**
 * @version 0.50
 */

 const INITIAL_STATE = {
    address : '',
    nfts: {
        assets: [],
        collections : [],
        usdTotal : ''
    },
    loaded : false
}

const nftsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_NFTS_LOADED':
            return {
                ...state,
                address : action.address || false,
                nfts : action.nfts || state.nfts,
                loaded : action.loaded || false
            }
        default:
            return state
    }
}

export default nftsStoreReducer
