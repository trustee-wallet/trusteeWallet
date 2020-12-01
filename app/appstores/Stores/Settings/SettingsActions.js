/**
 * @version 0.9
 */
import store from '../../../store'

import SettingsDS from '../../DataSource/Settings/Settings'

import Log from '../../../services/Log/Log'

const settingsDS = new SettingsDS()

const { dispatch } = store

const settingsActions = {

    getSetting: async (key) => {
        try {
            const tmp = await settingsDS.getSetting(key)
            return tmp ? tmp.paramValue : false
        } catch (e) {
            Log.err('ACT/Settings getSetting ' + key + ' error ' + e.message)
        }
    },

    getSettingStatic: (key) => {
        try {
            const tmp = settingsDS.getSettingStatic(key)
            return tmp ? tmp.paramValue : false
        } catch (e) {
            Log.err('ACT/Settings getSettingStatic ' + key + ' error ' + e.message)
        }
    },

    getSettings: async () => {
        try {
            const tmpSettings = await settingsDS.getSettings()
            const settings = {}

            let key
            for (key in tmpSettings) {
                settings[key] = tmpSettings[key].paramValue
            }
            if (typeof settings['language'] === 'undefined') {
                settings['language'] = 'en-US'
            }

            // init notifications settings
            if (typeof settings['notifs_status'] === 'undefined') settings['notifs_status'] = '0'
            if (typeof settings['transactions_notifs'] === 'undefined') settings['transactions_notifs'] = '1'
            if (typeof settings['exchange_rates_notifs'] === 'undefined') settings['exchange_rates_notifs'] = '1'
            if (typeof settings['news_notifs'] === 'undefined') settings['news_notifs'] = '1'

            dispatch({
                type: 'UPDATE_SETTINGS',
                settings
            })
        } catch (e) {
            Log.err('ACT/Settings getSettings error ' + e.message)
        }
    },

    setSettings: async (key, value) => {
        try {
            const res = await settingsDS.setSettings(key, value)
            if (res) {
                await settingsActions.getSettings()
            }
        } catch (e) {
            Log.err('ACT/Settings setSettings ' + key + ' error ' + e.message)
        }
    }
}

export default settingsActions
