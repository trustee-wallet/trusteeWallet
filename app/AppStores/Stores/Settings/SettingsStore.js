/**
 * @version 0.9
 */
const INITIAL_STATE = {
    data: {}
}

const settingsStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'UPDATE_SETTINGS':
            return {
                data: action.settings
            }
    }

    return state
}

export default settingsStoreReducer
