/**
 * @version 0.9
 */
import { AppState, Platform } from 'react-native'

import BackgroundTimer from 'react-native-background-timer'

import NavStore from '@app/components/navigation/NavStore'

import store from '@app/store'

import lockScreenAction from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { setBlurStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'


import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import UpdateAppNewsListDaemon from '@app/daemons/view/UpdateAppNewsListDaemon'

const TIME_DIFF = 300000

class AppLockScreenIdleTime {

    lockScreenTimerIOS = {}

    _init = false

    _backgroundTime = 0

    _activeTime = 0

    _isBlur = false

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
        this._handle(
            param,
            (innerInit) => {
                BackgroundTimer.runBackgroundTimer(innerInit, TIME_DIFF)
            },
            () => {
                BackgroundTimer.stopBackgroundTimer()
            }
        )
    }

    handleLockScreenStateIOS = (param) => {
        this._handle(
            param,
            (innerInit) => {
                this.lockScreenTimerIOS = setTimeout(innerInit, TIME_DIFF)
            },
            () => {
                clearTimeout(this.lockScreenTimerIOS)
            }
        )
    }

    _handle = (param, initFunction, clearFunction) => {
        if (param.state === 'background') {
            MarketingEvent.UI_DATA.IS_ACTIVE = false
            this._backgroundTime = new Date().getTime()

            UpdateOneByOneDaemon.stop()
            UpdateAccountListDaemon.stop()
            UpdateAppNewsListDaemon.stop()

            initFunction(() => {
                const { lockScreenStatus } = store.getState().settingsStore.keystore
                if (+lockScreenStatus) {
                    const diff = this._activeTime > 0 ? (new Date().getTime() - this._activeTime) : 0
                    if (diff > 300 && !this._isBlur) {
                        setBlurStatus(true)
                        this._isBlur = true
                    }
                }
            })

        } else if (param.state === 'inactive') {
            MarketingEvent.UI_DATA.IS_ACTIVE = false
        } else {
            MarketingEvent.UI_DATA.IS_ACTIVE = true
            this._activeTime = new Date().getTime()
            clearFunction()

            const diff = this._backgroundTime > 0 ? (new Date().getTime() - this._backgroundTime) : 0
            if (diff >= TIME_DIFF) {
                const { lockScreenStatus } = store.getState().settingsStore.keystore
                if (+lockScreenStatus && !MarketingEvent.UI_DATA.IS_LOCKED) {
                    UpdateOneByOneDaemon.stop()
                    UpdateAccountListDaemon.stop()
                    UpdateAppNewsListDaemon.stop()
                    lockScreenAction.setFlowType({
                        flowType: ''
                    })
                    lockScreenAction.setActionCallback({
                        actionCallback: () => {
                        }
                    })
                    MarketingEvent.UI_DATA.IS_LOCKED = true
                    MarketingEvent.UI_DATA.IS_ACTIVE = true
                    this._backgroundTime = 0
                    this._isBlur = false
                    setBlurStatus(false)
                    NavStore.reset('LockScreenPop')
                    return true
                }
            }
            MarketingEvent.UI_DATA.IS_ACTIVE = true
            this._backgroundTime = 0
            if (!MarketingEvent.UI_DATA.IS_LOCKED) {
                UpdateOneByOneDaemon.unstop()
                UpdateAccountListDaemon.unstop()
                UpdateAppNewsListDaemon.unstop()
            }
            if (this._isBlur) {
                setBlurStatus(false)
                this._isBlur = false
            }
        }
    }

}

const AppLockScreenIdleTimeSingle = new AppLockScreenIdleTime()
export default AppLockScreenIdleTimeSingle
