/**
 * @version 0.9
 */
import { AppState, Platform } from 'react-native'

import BackgroundTimer from 'react-native-background-timer'

import NavStore from '../../components/navigation/NavStore'

import store from '../../store'

import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'

import MarketingEvent from '../Marketing/MarketingEvent'

import {setBlurStatus} from "../../appstores/Stores/Main/MainStoreActions"
import UpdateOneByOneDaemon from "../../daemons/back/UpdateOneByOneDaemon";
import UpdateAccountListDaemon from "../../daemons/view/UpdateAccountListDaemon";
import UpdateAppNewsListDaemon from "../../daemons/view/UpdateAppNewsListDaemon";
import UpdateCurrencyListDaemon from "../../daemons/view/UpdateCurrencyListDaemon";

const TIME_DIFF = 30000

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
            UpdateCurrencyListDaemon.stop()

            initFunction(() => {
                const {lockScreenStatus} = store.getState().settingsStore.keystore
                if (+lockScreenStatus) {
                    const diff = this._activeTime > 0 ? ( new Date().getTime() - this._activeTime ) : 0
                    if (diff > 300) {
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

            let routeName = ''
            try {
                const tmp = NavStore.getCurrentRoute()
                routeName = tmp && typeof tmp.routeName !== 'undefined' ? tmp.routeName : ''
            } catch (e) {
                // do nothing
            }

            const diff = this._backgroundTime > 0 ? ( new Date().getTime() - this._backgroundTime ) : 0
            if (diff >= TIME_DIFF) {
                const {lockScreenStatus} = store.getState().settingsStore.keystore
                if (+lockScreenStatus) {
                    if (routeName !== 'LockScreen') {
                        UpdateOneByOneDaemon.stop()
                        UpdateAccountListDaemon.stop()
                        UpdateAppNewsListDaemon.stop()
                        UpdateCurrencyListDaemon.stop()
                        lockScreenAction.setFlowType({
                            flowType: ''
                        })
                        lockScreenAction.setActionCallback({ actionCallback: () => {} })
                        MarketingEvent.UI_DATA.IS_LOCKED = true
                        MarketingEvent.UI_DATA.IS_ACTIVE = true
                        this._backgroundTime = 0
                        this._isBlur = false
                        setBlurStatus(false)
                        NavStore.reset('LockScreen')
                        return true
                    }
                }
            }
            MarketingEvent.UI_DATA.IS_ACTIVE = true
            this._backgroundTime = 0
            if (routeName !== 'LockScreen') {
                UpdateOneByOneDaemon.unstop()
                UpdateAccountListDaemon.unstop()
                UpdateAppNewsListDaemon.unstop()
                UpdateCurrencyListDaemon.unstop()
            }
            if (this._isBlur) {
                setBlurStatus(false)
                this._isBlur = false
            }
        }
    }

}

export default new AppLockScreenIdleTime()
