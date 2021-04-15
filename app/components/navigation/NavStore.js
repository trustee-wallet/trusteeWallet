/**
 * @version 0.43
 * https://reactnavigation.org/docs/navigating-without-navigation-prop
 * https://reactnavigation.org/docs/navigation-prop/
 */
import config from '@app/config/config'

import { navigate, reset, goBack } from '@app/components/navigation/NavRoot'

class ObservableNavStore {

    reset = (routeName) => {
        try {
            reset({
                index: 0,
                routes: [{ name: routeName }],
            })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.reset error ' + e.message)
            }
        }
    }

    goBack = () => {
        try {
           goBack()
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.goBack error ' + e.message)
            }
        }
    }

    getCurrentRoute = (screen) => {
        try {
            if (typeof screen.props.route !== 'undefined' && typeof screen.props.route.name !== 'undefined') {
                return screen.props.route.name
            }
            return ''
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.getCurrentRoute error ' + e.message)
            }
        }
    }

    goNext = (routeName, params = null, reset = false) => {
        if (reset) {
            console.log('navstore reset is depressed')
            this.reset(routeName)
            return false
        }

        try {
            navigate(routeName, params)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NavStore.goNext error ' + e.message)
            }
        }
    }

    getParamWrapper = (screen, data, def = false) => {
        if (typeof screen.props.route.params[data] === 'undefined') {
            return def
        }
        return screen.props.route.params[data]
    }
}

const NavStore = new ObservableNavStore()

export default NavStore
