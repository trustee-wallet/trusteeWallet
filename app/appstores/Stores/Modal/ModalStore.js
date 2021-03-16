/**
 * @version 0.9
 */
const INITIAL_STATE = {
    show: false,
    data: {},
    callback: () => {
    }
}

const modalStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SHOW_MODAL':
            return {
                show: true,
                data: action.data,
                callback: action.callback
            }
        case 'HIDE_MODAL':
            return {
                show: false,
                data: action.data,
                callback: action.callback
            }
        case 'SET_DATA_MODAL':
            return {
                ...state,
                data: action.data
            }
    }

    return state
}

export default modalStoreReducer
