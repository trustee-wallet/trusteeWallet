/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ScrollView } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItemMain from '@app/components/elements/new/list/ListItem/Setting'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import Toast from '@app/services/UI/Toast/Toast'
import Log from '@app/services/Log/Log'
import { FileSystem } from '@app/services/FileSystem/FileSystem'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import SendLog from '@app/services/Log/SendLog'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

const LOGGING_SETTINGS = [
    {
        code: 'all'
    },
    {
        code: 'none'
    }
]

class LoggingSettingsScreen extends PureComponent {

    getCode = () => {
        let { loggingCode } = this.props.settingsData
        if (!loggingCode) loggingCode = 'all'
        return loggingCode
    }

    setCode = async (item) => {
        await settingsActions.setSettings('loggingCode', item.code)
        this.handleBack()
    }

    cleanAll = async () => {
        try {
            const zp = new FileSystem({ baseDir: 'zip', fileName: 'logsB', fileExtension: 'zip' })
            await zp.cleanDir()
            await Log.FS.ALL.cleanFile()
            await Log.FS.TEST.cleanFile()
            await Log.FS.DAEMON.cleanFile()
            await BlocksoftCryptoLog.FS.cleanFile()
            await Log.FS.ALL.cleanDir()
            Toast.setMessage('cleaned').show()
        } catch (e) {
            Toast.setMessage('error ' + e.message).show()
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleLogs = async () => {
        setLoaderStatus(true)

        let text = ''
        try {
            const shareOptions = await SendLog.getAll()
            if (shareOptions) {
                await prettyShare(shareOptions)
            }
            setLoaderStatus(false)
        } catch (e) {
            try {
                setLoaderStatus(false)

                text = e.message || JSON.stringify(e.error).substr(0, 100)
                let log = e.message
                if (typeof (e.error) !== 'undefined') {
                    if (e.error.toString().indexOf('No Activity') !== -1) {
                        text = strings('modal.walletLog.noMailApp')
                    } else if (!text) {
                        text = JSON.stringify(e.error).substr(0, 100)
                    }
                    log += ' ' + JSON.stringify(e.error)
                }

                if (typeof (e.error) !== 'undefined' && e.error.toString().indexOf('No Activity') !== -1) {
                    text = strings('modal.walletLog.noMailApp')

                }
                if (text.indexOf('User did not share') !== -1) {
                    text = strings('modal.walletLog.notComplited')
                }
                Log.err('SettingsMain.handleLogs error ' + log)
                BlocksoftCryptoLog.err('SettingsMain.handleLogs error ' + log)
            } catch (e1) {
                text = 'Share Error ' + e1.message
            }
        }
        if (text) {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.walletLog.sorry'),
                description: text
            })
        }
    }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.LoggingSettingsScreen')

        const code = this.getCode()

        const { colors, GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('loggingSettings.title')}
            >
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { padding: GRID_SIZE, paddingLeft: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps='handled'
                >

                    <View>
                        <Text style={[styles.text, { color: colors.common.text3, marginRight: GRID_SIZE * 3, marginVertical: GRID_SIZE * 1.5 }]}>{strings('loggingSettings.helper')}</Text>
                    </View>

                    {
                        LOGGING_SETTINGS.map((item, index) => (
                            <ListItem
                                key={item.code}
                                checked={item.code === code}
                                title={strings(`loggingSettings.codes.${item.code}`)}
                                onPress={() => this.setCode(item)}
                            />
                        ))
                    }

                    <ListItemMain
                        key='clear'
                        title={strings(`loggingSettings.clean`)}
                        onPress={() => this.cleanAll()}
                        iconType='shareLogs'
                    />

                    <ListItemMain
                        title={strings('settings.about.shareLogsTitle')}
                        subtitle={strings('settings.about.shareLogsSubtitle')}
                        iconType='shareLogs'
                        onPress={this.handleLogs}
                        last='true'
                    />


                </ScrollView>
            </ScreenWrapper>
        )
    }
}


LoggingSettingsScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        settingsData: getSettingsScreenData(state)
    }
}

export default connect(mapStateToProps)(LoggingSettingsScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    },
    text: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
        flex: 2
    }
})
