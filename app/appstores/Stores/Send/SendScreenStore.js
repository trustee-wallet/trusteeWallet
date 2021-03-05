/**
 * @version 0.31
 * @author yura
 */

const INITIAL_STATE = {
    ui: {

    }
}

const sendScreenStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_DATA':
            return {
                ui: {
                    ...state.ui,
                    ...action.ui
                },
            }
        case 'CLEAN_DATA':
            return {
                ui: {}
            }
        default:
            return state
    }
}

export default sendScreenStoreReducer
