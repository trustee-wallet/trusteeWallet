/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import {
    StyleSheet,
    ScrollView,
} from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { strings } from '@app/services/i18n'

import config from '@app/config/config'
import AppNotificationListener from '@app/services/AppNotification/AppNotificationListener'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { setBseLink } from '@app/appstores/Stores/Main/MainStoreActions'


class LanguageListScreen extends PureComponent {

    getLangCode = () => {

        const { languageList } = config.language

        let { language } = this.props.settings.data

        const tmpLanguage = languageList.find((item) => item.code.split('-')[0] == language.split('-')[0])

        return typeof tmpLanguage == 'undefined' ? 'en-US' : tmpLanguage.code
    }

    setLanguage = async (item) => {

        await settingsActions.setSettings('language', item.code)

        await AppNotificationListener.updateSubscriptionsLater()

        setBseLink(null)

        this.handleBack()

    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.LanguageListScreen')

        const { languageList } = config.language
        const language = this.getLangCode()

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('languageList.title')}
                setHeaderHeight={this.setHeaderHeight}
            >
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
            </ScreenWrapper>
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
    scrollViewContent: {
        flexGrow: 1,
    },
})
