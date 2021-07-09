/**
 * @version 0.30
 * @todo server settings design and use or remove commented
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View } from 'react-native'

import LetterSpacing from '../../../../components/elements/LetterSpacing'

import { strings } from '../../../../services/i18n'

import NavStore from '../../../../components/navigation/NavStore'
import { setFlowType } from '../../../../appstores/Stores/CreateWallet/CreateWalletActions'

import ListItem from '../../../../components/elements/new/list/ListItem/Setting'
import { ThemeContext } from '@app/theme/ThemeProvider'
import styles from './styles'
import { Colors } from 'react-native/Libraries/NewAppScreen'


let CACHE_INITED = false

class SettingsXMR extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentServer: '',
            currentServerSend: '',
            size: 0
        }
        this.serverInput = React.createRef()
        this.serverSendInput = React.createRef()
        CACHE_INITED = false
    }


    /*init = async () => {

        if (CACHE_INITED) {
            return true
        }

        let url = await settingsActions.getSetting('xmrServer')
        if (!url || url === 'false') url = ''

        let urlSend = await settingsActions.getSetting('xmrServerSend')
        if (!urlSend || urlSend === 'false') urlSend = ''

        this.serverInput.handleInput(url)
        this.serverSendInput.handleInput(urlSend)

        this.setState({
            currentServer: url,
            currentServerSend: urlSend
        })
        CACHE_INITED = true
    }

    handleSave = async () => {
        let serverInputValidate = { status: false }
        let serverSendInputValidate = { status: false }
        try {
            serverInputValidate = await this.serverInput.handleValidate()
            serverSendInputValidate = await this.serverSendInput.handleValidate()
        } catch (e) {
            Log.log('SettingsXmr.handleSave error validation ' + e.message)
        }
        if (serverInputValidate.status !== 'success' || serverSendInputValidate.status !== 'success') return

        let serverNewValue = serverInputValidate.value
        if (!serverNewValue) {
            serverNewValue = ''
        }
        await settingsActions.setSettings('xmrServer', serverNewValue)
        this.serverInput.handleInput(serverNewValue)


        let serverSendNewValue = serverSendInputValidate.value
        if (!serverSendNewValue) {
            serverSendNewValue = ''
        }
        await settingsActions.setSettings('xmrServerSend', serverSendNewValue)
        this.serverSendInput.handleInput(serverSendNewValue)

        this.setState({
            currentServer: serverNewValue,
            currentServerSend: serverSendNewValue
        })
        Keyboard.dismiss()
        Toast.setMessage(strings('toast.saved')).show()
    }*/

    handleSecrets = async () => {
        setFlowType({
            flowType: 'BACKUP_WALLET_XMR'
        })
        NavStore.goNext('BackupStep0Screen')
    }

    render() {
        // this.init()

        const { colors } = this.context

        return (
            <>
                <View>
                    <ListItem
                        title={strings('settings.walletList.getMnemonicXMR')}
                        iconType='keyMonero'
                        onPress={this.handleSecrets}
                        rightContent="arrow"
                    />
                </View>
            </>
        )

        /*
        return (
            <View style={[styles.settings, containerStyle]}>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <Text style={styles.text}>
                                    {strings('settings.walletList.serverInputXMR')}
                                </Text>
                                <Input
                                    ref={ref => this.serverInput = ref}
                                    id={'server'}
                                    name={strings('settings.walletList.serverInputTitleXMR')}
                                />
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <Text style={styles.text}>
                                    {strings('settings.walletList.serverSendInputXMR')}
                                </Text>
                                <Input
                                    ref={ref => this.serverSendInput = ref}
                                    id={'serverSend'}
                                    name={strings('settings.walletList.serverSendInputTitleXMR')}
                                />
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleSave}>
                                    <LetterSpacing text={strings('settings.walletList.saveSettings')}
                                                   textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                                   numberOfLines={2} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleSecrets}>
                                    <LetterSpacing text={strings('settings.walletList.getMnemonicXMR')}
                                                   textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                                   numberOfLines={2} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

            </View>
        )
        */
    }
}

const mapStateToProps = (state) => {
    return {
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
