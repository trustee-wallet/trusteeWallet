/**
 * @version 0.9
 */
const INITIAL_STATE = {
    dashboardStack: {
        initialRouteName: 'HomeScreenStack'
    }
}

const navigationStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_DASHBOARD_INITIAL_ROUTE_NAME':
            return action.settings
        default:
            return state
    }
}

export default navigationStoreReducer
