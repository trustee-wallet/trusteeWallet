import * as RNLocalize from 'react-native-localize'
const locales = RNLocalize.getLocales()

export default {
    settings: {
        lock_screen_status: 0,
        touchID_status: 0,
        language: locales[0].languageTag,
        local_currency: 'USD',
        btc_legacy_or_segwit : 'segwit'
    },
}
