/**
 * @version 0.9
 */
import { NavigationActions, StackActions } from 'react-navigation'

import navigationActions from '../../appstores/Stores/Navigation/NavigationActions'

class ObservableNavStore {
    navigator = null

    getNavigator = () => this.navigator

    reset = (routeName, params = null) => {

        try {
            const resetAction = StackActions.reset({
                key: null,
                index: 0,
                actions: [NavigationActions.navigate({ routeName, params })]
            })
            this.navigator.dispatch(resetAction)
        } catch (e) {
            console.log(e)
        }
    }

    goBack = () => {
        try {
            this.navigator.dispatch(NavigationActions.back())
        } catch (e) {
        }
    }

    goNext = (routeName, params = null, reset = false) => {
        try {
            this.navigator && this.navigator.dispatch(NavigationActions.navigate({
                routeName,
                params
            }))

            if (reset) {
                const resetAction = StackActions.reset({
                    key: null,
                    index: 0,
                    actions: [NavigationActions.navigate({ routeName: 'DashboardStack', params })]
                })
                this.navigator.dispatch(resetAction)
            }

            // if(reset){
            //     this.navigator.dismiss()
            // }
        } catch (e) {
            console.log(e)
        }
    }

    setDashboardInitialRouteName = (dashboardInitialRouteName) => {
        navigationActions.setDashboardInitialRouteName(dashboardInitialRouteName)
        return this
    }

    getParam = (data) => this.navigator.dispatch(NavigationActions.getParam(data))
}

const NavStore = new ObservableNavStore()

export default NavStore
