import NavStore from '../components/navigation/NavStore'
import BackgroundTimer from 'react-native-background-timer'
import {
    AppState,
    Platform
} from 'react-native'

import store from '../store'

import lockScreenAction from '../appstores/Actions/LockScreenActions'

class LockScreenIdleTime {

    lockScreenTimerIOS = {}

    _init = false
    
    init() {
        if(!this._init){
            Platform.OS === 'android' ?
                AppState.addEventListener('change', (state) => this.handleLockScreenStateAndroid({ state })):
                BackgroundTimer.start()
            AppState.addEventListener('change', (state) => this.handleLockScreenStateIOS({ state }))

            this._init = true
        }
    }

    handleLockScreenStateAndroid = (param) => {
        if (param.state === 'background') {

            BackgroundTimer.runBackgroundTimer(() => {
                const { lock_screen_status } = store.getState().settingsStore.data

                if(+lock_screen_status){
                    lockScreenAction.setFlowType({
                        flowType: ''
                    })
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
                const { lock_screen_status } = store.getState().settingsStore.data

                if(+lock_screen_status){
                    lockScreenAction.setFlowType({
                        flowType: ''
                    })
                    NavStore.reset('LockScreen')
                }
            }, 300000)
        } else {
            clearTimeout(this.lockScreenTimerIOS)
        }
    }

}

export default new LockScreenIdleTime()