
/* NODE MODULES */
import * as RNLocalize from 'react-native-localize';


export default function getInitialData() {
    const locales = RNLocalize.getLocales();
    return {
        settings: {
            language: locales[0].languageTag,
            local_currency: 'USD',
            btc_legacy_or_segwit: 'legacy'
        },
    }
}
