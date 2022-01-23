/**
 * @version 0.50
 */
import store from '@app/store'

import settingsDS from '@app/appstores/DataSource/Settings/Settings'
import Log from '@app/services/Log/Log'
import { SettingsKeystore } from './SettingsKeystore'
import { fioSdkWrapper } from '@crypto/blockchains/fio/FioSdkWrapper'

import * as RNLocalize from 'react-native-localize'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

const { dispatch } = store

const locales = RNLocalize.getLocales();

const defaultSettings = {
    language : locales[0].languageTag,
    local_currency: 'USD',
    btc_legacy_or_segwit: 'segwit',

    notifsStatus : '1',
    transactionsNotifs : '1',
    exchangeRatesNotifs : '1',
    newsNotifs : '1',
    isBalanceVisible : '1'
}

const settingsActions = {

    getSetting: async (key) => {
        try {
            const tmp = await settingsDS.getSetting(key)
            return tmp ? tmp.paramValue : (typeof defaultSettings[key] !== 'undefined' ? defaultSettings[key] : false)
        } catch (e) {
            Log.err('ACT/Settings getSetting ' + key + ' error ' + e.message)
        }
    },

    getSelectedWallet : async (source) => {
        try {
            // console.log(await settingsActions.getSettings())
            const walletHash = await settingsActions.getSetting('SELECTED_WALLET')
            if (walletHash) {
                await fioSdkWrapper.init(walletHash, source)
            }
            await MarketingEvent.reinitByWallet(walletHash)
            return walletHash
        } catch (e) {
            Log.err('ACT/Settings getSelectedWallet ' + source + ' error ' + e.message)
        }
    },

    setSelectedWallet : async (walletHash) => {
        return settingsActions.setSettings('SELECTED_WALLET', walletHash)
    },

    getSettingStatic: (key) => {
        try {
            const tmp = settingsDS.getSettingStatic(key)
            return tmp ? tmp.paramValue : false
        } catch (e) {
            Log.err('ACT/Settings getSettingStatic ' + key + ' error ' + e.message)
        }
    },

    /**
     * @param updateStore
     * @param reloadDB - for not reviewed code support
     * @returns {Promise<{exchangeRatesNotifs: string, transactionsNotifs: string, newsNotifs: string, isBalanceVisible: string, notifsDevToken: string, language: string, notifsStatus: string}>}
     */
    getSettings: async (updateStore = true, reloadDB = true) => {
        try {
            const tmpSettings = await settingsDS.getSettings(reloadDB)
            const settings = {...defaultSettings}

            let key
            for (key in tmpSettings) {
                settings[key] = tmpSettings[key].paramValue
            }

            if (updateStore) {
                dispatch({
                    type: 'UPDATE_SETTINGS',
                    settings,
                    keystore : {
                        lockScreenStatus : await SettingsKeystore.getLockScreenStatus(),
                        askPinCodeWhenSending : await SettingsKeystore.getAskPinCodeWhenSending(),
                        touchIDStatus : await SettingsKeystore.getTouchIDStatus()
                    }
                })
            }

            return settings
        } catch (e) {
            Log.err('ACT/Settings getSettings error ' + e.message)
        }
    },

    setSettings: async (key, value) => {
        try {
            const res = await settingsDS.setSettings(key, value)
            if (res) {
                await settingsActions.getSettings(true, false)
            }
        } catch (e) {
            Log.err('ACT/Settings setSettings ' + key + ' error ' + e.message)
        }
    },

    setSettingKeyArray: async (keyValues) => {
        try {
            for(const key in keyValues) {
                const value = keyValues[key]
                await settingsDS.setSettings(key, value)
            }
            await settingsActions.getSettings()
        } catch (e) {
            Log.err('ACT/Settings setSettingsKeyArray ' + JSON.stringify(keyValues) + ' error ' + e.message)
        }
    }
}

export default settingsActions
