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

    render() {
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
                </View>
            </>
        )
    }
}

SettingsXMR.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SettingsXMR)
