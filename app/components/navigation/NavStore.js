import {NavigationActions, StackActions} from 'react-navigation'

import navigationActions from '../../appstores/Actions/NavigationActions'

class ObservableNavStore {
    navigator = null;

    reset = (routeName) => {
        const resetAction = StackActions.reset({
            key: null,
            index: 0,
            actions: [NavigationActions.navigate({ routeName })],
        });
        this.navigator.dispatch(resetAction)
    };

    goBack = () => {
        this.navigator.dispatch(NavigationActions.back())
    };

    goNext = (routeName, params = null) => {
        this.navigator && this.navigator.dispatch(NavigationActions.navigate({
            routeName,
            params
        }));
    };

    setDashboardInitialRouteName = (dashboardInitialRouteName) => {
        navigationActions.setDashboardInitialRouteName(dashboardInitialRouteName)
        return this
    }

    getParam = (data) => this.navigator.dispatch(NavigationActions.getParam(data));
}

const NavStore = new ObservableNavStore();

export default NavStore
