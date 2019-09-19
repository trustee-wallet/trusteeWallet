const INITIAL_STATE = {
    dashboardStack: {
        initialRouteName: 'HomeScreenStack'
    }
};

const navigationReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'SET_DASHBOARD_INITIAL_ROUTE_NAME':
            return action.settings
        default:
            return state;
    }
};

export default navigationReducer;