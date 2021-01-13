/**
 * @version 0.9
 */
import * as RNLocalize from 'react-native-localize'
const locales = RNLocalize.getLocales()

export default {
    settings: {
        language: locales[0].languageTag,
        local_currency: 'USD',
        btc_legacy_or_segwit : 'legacy'
    },
}
