import analytics from '@react-native-firebase/analytics'

let CACHE_PREV_NAME = ''

export default new class MarketingAnalytics {
    setCurrentScreen(name) {
        if (CACHE_PREV_NAME === name) {
            return
        }
        analytics().logScreenView({
            screen_class: name,
            screen_name: name
        })
        CACHE_PREV_NAME = name
    }
}
