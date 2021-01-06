import analytics from '@react-native-firebase/analytics'

export default new class MarketingAnalytics {
    setCurrentScreen(name) {
        analytics().logScreenView({
            screen_class: name,
            screen_name: name
        })
    }
}
