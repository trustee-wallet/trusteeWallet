import store from '../../store'

import SettingsDS from '../DataSource/Settings/Settings'

import Log from '../../services/Log/Log'

const { dispatch } = store

const settingsActions = {
    getSettings: async () => {

        Log.log('ACT/Settings getSettings called')

        const settingsDS = new SettingsDS()

        try {
            const { array: tmpSettings } = await settingsDS.getSettings()
            const settings = {}

            for (const setting of tmpSettings) settings[`${setting.paramKey}`] = setting.paramValue

            dispatch({
                type: 'UPDATE_SETTINGS',
                settings
            })

            Log.log('ACT/Settings getSettings finished')
        } catch (e) {
            Log.err('ACT/Settings getSettings error ' + e.message)
        }
    },

    setSettings: async (key, value) => {

        Log.log('ACT/Settings setSettings called')

        const settingsDS = new SettingsDS()

        try {

            await settingsDS.setSettings(key, value)
            await settingsActions.getSettings()

            //NavStore.reset('DashboardStack')

            Log.log('ACT/Settings setSettings finished')
        } catch (e) {
            Log.err('ACT/Settings setSettings error ' + e.message)
        }
    }
}

export default settingsActions
