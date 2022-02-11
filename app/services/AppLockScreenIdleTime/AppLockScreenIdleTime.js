/**
 * @version 0.9
 */
import { AppState, Platform, StatusBar } from 'react-native'

import BackgroundTimer from 'react-native-background-timer'

import NavStore from '@app/components/navigation/NavStore'

import store from '@app/store'

import { setBlurStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import Log from '@app/services/Log/Log'
import { LockScreenFlowTypes, resetLockScreen, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'

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
            AppState.addEventListener('change', this.handlerAndroid)
        } else {
            BackgroundTimer.start()
            AppState.addEventListener('change', this.handlerIOS)
        }
    }

    willUnmount() {
        if (Platform.OS === 'android') {
            AppState.removeEventListener('change', this.handlerAndroid)
        } else {
            BackgroundTimer.stop()
            AppState.removeEventListener('change', this.handlerIOS)
        }
    }

    handlerAndroid = (state) => {
        this.handleLockScreenStateAndroid({ state })
    }

    handlerIOS = (state) => {
        this.handleLockScreenStateIOS({ state })
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
            resetLockScreen(0, 'AppLockScreenIdleTime gone to background')

            initFunction(() => {
                const { lockScreenStatus } = store.getState().settingsStore.keystore
                if (+lockScreenStatus) {
                    const diff = this._activeTime > 0 ? new Date().getTime() - this._activeTime : 0
                    if (diff > 300 && !this._isBlur) {
                        setBlurStatus(true)
                        this._isBlur = true
                    }
                }
            })
        } else if (param.state === 'inactive') {
            MarketingEvent.UI_DATA.IS_ACTIVE = false
            if (!this._isBlur) {
                setBlurStatus(true)
                this._isBlur = true
            }
        } else {
            Log.log('AppLockScreenIdleTime unlocked')
            UpdateOneByOneDaemon.unstop()
            UpdateAccountListDaemon.unstop()

            MarketingEvent.UI_DATA.IS_ACTIVE = true
            this._activeTime = new Date().getTime()
            clearFunction()

            const diff = this._backgroundTime > 0 ? new Date().getTime() - this._backgroundTime : 0
            if (diff >= TIME_DIFF) {
                const { lockScreenStatus } = store.getState().settingsStore.keystore
                if (+lockScreenStatus && !MarketingEvent.UI_DATA.IS_LOCKED) {
                    hideModal()
                    UpdateOneByOneDaemon.stop()
                    UpdateAccountListDaemon.stop()
                    MarketingEvent.UI_DATA.IS_LOCKED = true
                    MarketingEvent.UI_DATA.IS_ACTIVE = true
                    this._backgroundTime = 0
                    this._isBlur = false
                    setBlurStatus(false)
                    setLockScreenConfig({ flowType: LockScreenFlowTypes.INIT_POPUP, callback: false })
                    NavStore.reset('LockScreenPop')
                    return true
                }
            }
            resetLockScreen(6000000, 'AppLockScreenIdleTime activated')
            MarketingEvent.UI_DATA.IS_ACTIVE = true
            StatusBar.setBarStyle(MarketingEvent.UI_DATA.IS_LIGHT ? 'dark-content' : 'light-content')
            this._backgroundTime = 0

            if (this._isBlur) {
                setBlurStatus(false)
                this._isBlur = false
            }
        }
    }
}

const AppLockScreenIdleTimeSingle = new AppLockScreenIdleTime()
export default AppLockScreenIdleTimeSingle
