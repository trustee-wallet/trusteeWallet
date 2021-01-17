import analytics from '@react-native-firebase/analytics'
import MarketingEvent from "./MarketingEvent";

let CACHE_PREV_NAME = ''

export default new class MarketingAnalytics {
    setCurrentScreen(name) {
        if (CACHE_PREV_NAME === name) {
            return
        }
        if (MarketingEvent.UI_DATA.IS_ACTIVE) {
            analytics().logScreenView({
                screen_class: name,
                screen_name: name
            })
            CACHE_PREV_NAME = name
        }
    }
}
