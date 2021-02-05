/**
 * @version 30
 * @author yura
 */

const INITIAL_STATE = {
    ui: {},
    addData: {}
}

const sendScreenStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_DATA':
            return {
                ui: {
                    ...state.ui,
                    ...action.ui
                },
                addData: {
                    ...state.addData,
                    ...action.addData
                }
            }
        case 'CLEAN_DATA':
            return {
                ui: {},
                addData: {}
            }
        default:
            return state
    }
}

export default sendScreenStoreReducer