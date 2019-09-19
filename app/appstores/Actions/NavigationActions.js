import store from '../../store';

const { dispatch } = store;

export default {
    setDashboardInitialRouteName: (dashboardInitialRouteName) => {

        const state = store.getState().navigationStore

        const tmpState = JSON.parse(JSON.stringify(state))

        tmpState.dashboardStack.initialRouteName = dashboardInitialRouteName

        dispatch({
            type: 'SET_DASHBOARD_INITIAL_ROUTE_NAME',
            settings: tmpState
        });
    }
}