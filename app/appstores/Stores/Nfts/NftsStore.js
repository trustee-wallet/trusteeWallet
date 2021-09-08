/**
 * @version 0.50
 */

const INITIAL_STATE = {
    address: '',
    derivationPath: '',
    nfts: {
        assets: [],
        collections: [],
        usdTotal: ''
    },
    loaded: false
}

const nftsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_NFTS_LOADED':
            return {
                ...state,
                derivationPath: action.derivationPath || state.derivationPath,
                address: action.address || state.address,
                nfts: action.nfts || state.nfts,
                loaded: action.loaded || false
            }
        default:
            return state
    }
}

export default nftsStoreReducer
