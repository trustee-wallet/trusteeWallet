/**
 * @version 0.9
 */
import { NavigationActions, StackActions } from 'react-navigation'

import navigationActions from '../../appstores/Stores/Navigation/NavigationActions'
import { setCurrentScreen } from '../../appstores/Stores/Main/MainStoreActions'
import config from '../../config/config'

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
            if (config.debug.appErrors) {
                console.log('NavStore.reset error ' + e.message)
            }
        }
    }

    goBack = () => {
        try {
            if (this.navigator.state.nav.routes.length <= 1) {
                this.reset('DashboardStack')
            } else {
                this.navigator.dispatch(NavigationActions.back())
            }
            setCurrentScreen(this.getCurrentRoute())
        } catch (e) {

        }
    }

    getCurrentRoute = () => {
        let route = this.navigator.state.nav
        while (route.routes) {
            route = route.routes[route.index]
        }
        return route
    }

    getPrevRoute = () => {
        let route = this.navigator.state.nav
        route = route.index > 0 ? route.routes[route.index - 1] : false
        return route
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
            if (config.debug.appErrors) {
                console.log('NavStore.goNext error ' + e.message)
            }
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
