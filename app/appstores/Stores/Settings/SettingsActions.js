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
