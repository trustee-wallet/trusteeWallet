/**
 * @version 0.50
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View } from 'react-native'

import { strings } from '@app/services/i18n'

import NavStore from '@app/components/navigation/NavStore'
import { setFlowType } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'

import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import { ThemeContext } from '@app/theme/ThemeProvider'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import Log from '@app/services/Log/Log'


class SettingsXMR extends Component {

    handleSecrets = async () => {
        setFlowType({
            flowType: 'BACKUP_WALLET_XMR'
        })
        NavStore.goNext('BackupStep0Screen')
    }

    handlePrivate = async () => {
        NavStore.goNext('AccountSettingsPrivate')
    }

    handleMyMonero = async () => {
        try {
            setLoaderStatus(true)
            const val = await settingsActions.getSetting('xmrAllowMyMonero')
            if (!val || val === '0' || val === '-1') {
                await settingsActions.setSettings('xmrAllowMyMonero', '1')
            } else {
                await settingsActions.setSettings('xmrAllowMyMonero', '-1')
            }
            setLoaderStatus(false)
        } catch (e) {
            console.log('Settings.XMR.handleMyMonero ' + e.message)
        }
        setLoaderStatus(false)
    }


    render() {
        const { settingsStore } = this.props
        const { xmrAllowMyMonero = '1' } = settingsStore
        return (
            <>
                <View>
                    <ListItem
                        title={strings('settings.walletList.getMnemonicXMR')}
                        iconType='keyMonero'
                        onPress={this.handleSecrets}
                        rightContent="arrow"
                    />
                    <ListItem
                        title={'Private Keys'}
                        iconType='keyMonero'
                        onPress={this.handlePrivate}
                        rightContent="arrow"
                    />
                    <ListItem
                        title={'mymonero api'}
                        iconType="rbf"
                        onPress={this.handleMyMonero}
                        rightContent="switch"
                        switchParams={{ value: xmrAllowMyMonero === '1', onPress: this.handleMyMonero }}
                    />
                </View>
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore.data,
        mainStore: state.mainStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

SettingsXMR.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsXMR)