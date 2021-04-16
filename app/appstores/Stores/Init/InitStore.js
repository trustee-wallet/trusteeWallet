/**
 * @version 0.43
 */

 const INITIAL_STATE = {
    init: false,
    initError : false
}

const initStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_INIT_STATE':
            return {
                ...state,
                init: action.init
            }
        case 'SET_INIT_ERROR':
            return {
                ...state,
                initError: action.initError
            }
        default:
            return state
    }
}

export default initStoreReducer
