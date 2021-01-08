/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView
} from 'react-native'



import NavStore from '../../components/navigation/NavStore'

import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

import { strings } from '../../services/i18n'

import config from '../../config/config'
import AppNotificationListener from '../../services/AppNotification/AppNotificationListener'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'


class LanguageListScreen extends Component {
    state = {
        headerHeight: 0
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    getLangCode = () => {

        const { languageList } = config.language

        let { language } = this.props.settings.data

        const tmpLanguage = languageList.find((item) => item.code.split('-')[0] == language.split('-')[0])

        return typeof tmpLanguage == 'undefined' ? 'en-US' : tmpLanguage.code
    }

    setLanguage = async (item) => {

        await settingsActions.setSettings('language', item.code)

        await AppNotificationListener.updateSubscriptionsLater()

        this.handleBack()

    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.LanguageListScreen')

        const { languageList } = config.language
        const language = this.getLangCode()

        const { colors, GRID_SIZE } = this.context
        const { headerHeight } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('languageList.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollViewContent, { padding: GRID_SIZE, paddingLeft: GRID_SIZE * 2 }]}
                        keyboardShouldPersistTaps="handled"
                    >
                        {
                            languageList.map((item, index) => (
                                <ListItem
                                    checked={item.code === language}
                                    title={strings(`languageList.languages.${item.code}`)}
                                    onPress={() => this.setLanguage(item)}
                                    last={languageList.length - 1 === index}
                                />
                            ))
                        }
                    </ScrollView>
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

LanguageListScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(LanguageListScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
})
