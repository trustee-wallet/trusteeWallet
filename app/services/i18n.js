/**
 * @version 0.9
 */
// import i18n from 'i18n-js'
import { getLocales } from 'react-native-localize'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import moment from 'moment'
import 'moment/min/locales.min'

import store from '../store'
import en from '../../locales/en.json'
import ru from '../../locales/ru.json'
import uk from '../../locales/uk.json'
import ka from '../../locales/ka.json'
import fr from '../../locales/fr.json'

let CACHE_SELECTED_LANGUAGE = false

const locales = getLocales()
if (Array.isArray(locales)) {
    CACHE_SELECTED_LANGUAGE = locales[0].languageTag
} else {
    CACHE_SELECTED_LANGUAGE = 'en-US'
}

i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    lng: CACHE_SELECTED_LANGUAGE,
    fallbackLng: 'en-US',
    resources: {
        en: { translation: en },
        ru: { translation: ru },
        uk: { translation: uk },
        ka: { translation: ka },
        fr: { translation: fr }
    },
    interpolation: {
        escapeValue: false
    }
})

store.subscribe(() => {
    const language = store.getState().settingsStore.data.language

    if (typeof language !== 'undefined' && i18n?.language?.toString() !== language?.toString()) {
        i18n.changeLanguage(language)
        setupMoment()
    }
})

export function strings(name, params = {}) {
    let tmp = i18n.t(name, params)

    if (tmp.indexOf('{') !== -1 && tmp.indexOf('{{') === -1) {
        tmp = i18n.t(tmp.replaceAll('{', '{{').replaceAll('}', '}}'), params)
    }
    return tmp
}

export function sublocale(locale) {
    if (typeof locale === 'undefined' || !locale) {
        locale = i18n?.language
    }
    let sub = locale.split('-')[0]
    if (
        sub !== 'uk' &&
        sub !== 'ru' &&
        sub !== 'ka' &&
        sub !== 'fr'
        // && sub !== 'de' && sub !== 'es' && sub !== 'fr' // @todo de/es/fr languages
    ) {
        sub = 'en'
    }
    return sub
}

function setupMoment() {
    try {
        const code = sublocale()
        moment.locale(code, {
            calendar: {
                lastDay: `[${strings('notifications.yesterday')}]`,
                sameDay: `[${strings('notifications.today')}]`,
                lastWeek: code === 'en' ? 'MMM DD, YYYY' : 'MMMM DD, YYYY',
                sameElse: code === 'en' ? 'MMM DD, YYYY' : 'MMMM DD, YYYY'
            }
        })
    } catch (e) {
        throw new Error(e.message + ' in setupMoment')
    }
}
setupMoment()

export default i18n
