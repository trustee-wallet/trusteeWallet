/**
 * @version 0.9
 */
import { AppState, Platform } from 'react-native'

import BackgroundTimer from 'react-native-background-timer'

import NavStore from '../../components/navigation/NavStore'

import store from '../../store'

import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'

import Log from '../../services/Log/Log'

class AppLockScreenIdleTime {

    lockScreenTimerIOS = {}

    _init = false

    init() {
        if (this._init) {
            return true
        }
        if (Platform.OS === 'android') {
            AppState.addEventListener('change', (state) => this.handleLockScreenStateAndroid({ state }))
        } else {
            BackgroundTimer.start()
            AppState.addEventListener('change', (state) => this.handleLockScreenStateIOS({ state }))
        }
    }

    handleLockScreenStateAndroid = (param) => {
        if (param.state === 'background') {

            BackgroundTimer.runBackgroundTimer(() => {
                const { lockScreenStatus } = store.getState().settingsStore.keystore

                if (+lockScreenStatus) {
                    Log.daemon('LockScreen on background timer runned Android')
                    lockScreenAction.setFlowType({
                        flowType: ''
                    })
                    lockScreenAction.setActionCallback({ actionCallback: () => {} })
                    NavStore.reset('LockScreen')
                }
            }, 300000)
        } else {
            BackgroundTimer.stopBackgroundTimer()
        }
    }

    handleLockScreenStateIOS = (param) => {
        if (param.state === 'background') {
            this.lockScreenTimerIOS = setTimeout(() => {
                const { lockScreenStatus } = store.getState().settingsStore.keystore

                if (+lockScreenStatus) {
                    Log.daemon('LockScreen on background timer runned Ios')

                    lockScreenAction.setFlowType({
                        flowType: ''
                    })
                    lockScreenAction.setActionCallback({ actionCallback: () => {} })
                    NavStore.reset('LockScreen')
                }
            }, 300000)
        } else {
            clearTimeout(this.lockScreenTimerIOS)
        }
    }

}

export default new AppLockScreenIdleTime()
