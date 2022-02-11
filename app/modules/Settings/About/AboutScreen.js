/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Linking,
} from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftCustomLinks from '@crypto/common/BlocksoftCustomLinks'

import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import SendLog from '@app/services/Log/SendLog'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'

import Log from '@app/services/Log/Log'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

import config from '@app/config/config'

import { ThemeContext } from '@app/theme/ThemeProvider'
import RoundButton from '@app/components/elements/new/buttons/RoundButton'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'


const SOCIAL_LINKS = [
    { name: 'telegram', link: 'SOCIAL_LINK_TELEGRAM' },
    { name: 'twitter', link: 'SOCIAL_LINK_TWITTER' },
    { name: 'facebook', link: 'SOCIAL_LINK_FACEBOOK' },
    { name: 'instagram', link: 'SOCIAL_LINK_INSTAGRAM' },
    { name: 'vk', link: 'SOCIAL_LINK_VK' },
    { name: 'github', link: 'SOCIAL_LINK_GITHUB' },
    { name: 'youtube', link: 'SOCIAL_LINK_YOUTUBE' }
];

class AboutScreen extends PureComponent {

    copyVersion = () => {
        copyToClipboard(`${config.version.code} | #${config.version.hash}`)
        Toast.setMessage(strings('toast.copied')).show(-100)
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    handleTermsPress = () => {
        const url = BlocksoftCustomLinks.getLink(`TERMS`, this.context.isLight)
        NavStore.goNext('WebViewScreen', { url, title: strings('settings.about.terms') })
    }

    handlePrivacyPolicyPress = () => {
        const url = BlocksoftCustomLinks.getLink(`PRIVACY_POLICY`, this.context.isLight)
        NavStore.goNext('WebViewScreen', { url, title: strings('settings.about.privacy') })
    }

    handleSupport = async () => {
        const link = BlocksoftExternalSettings.get('SUPPORT_BOT')
        MarketingEvent.logEvent('taki_support', { link, screen: 'SETTINGS' })
        NavStore.goNext('BotSupportScreen', { url: link, title: strings('settings.about.contactSupportTitle'), backOnClose: true })
    }

    handleSupportEmail = () => {
        Linking.openURL('mailto: ' + BlocksoftExternalSettings.getStatic('SUPPORT_EMAIL'))
    }

    handleLogs = async () => {
        setLoaderStatus(true)

        try {
            const shareOptions = await SendLog.getAll()
            if (shareOptions) {
                await prettyShare(shareOptions)
            }
            setLoaderStatus(false)
        } catch (e) {
            try {
                setLoaderStatus(false)

                let text = e.message || JSON.stringify(e.error).substr(0, 100)
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
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.walletLog.sorry'),
                    description: text
                })
            } catch (e1) {
                Log.err('SettingsMain.handleLogs error1 ' + e1.message)
            }
        }
    }

    openSocial = async (linkName) => {
        const link = await BlocksoftExternalSettings.get(linkName)
        if (link) Linking.openURL(link)
    }

    render() {
        MarketingAnalytics.setCurrentScreen('About.index')

        const { colors, GRID_SIZE, isLight } = this.context

        const currentYear = new Date().getFullYear()

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('settings.about.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { paddingHorizontal: GRID_SIZE }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.topContent, { marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE }]}>
                        <Image
                            style={styles.logo}
                            resizeMode='stretch'
                            source={isLight ? require('@assets/images/logo.png') : require('@assets/images/logoWhite.png')}
                        />
                        <TouchableOpacity activeOpacity={0.8} onPress={this.copyVersion}>
                            <Text style={[styles.version, { color: colors.common.text1 }]}>{strings('settings.about.version', { version: config.version.code })}</Text>
                            <Text style={[styles.commitHash, { color: colors.common.text3 }]}>{`#${config.version.hash}`}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginVertical: GRID_SIZE }}>
                        <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{strings('settings.about.feedback')}</Text>
                        <ListItem
                            title={strings('settings.about.shareLogsTitle')}
                            subtitle={strings('settings.about.shareLogsSubtitle')}
                            iconType="shareLogs"
                            onPress={this.handleLogs}
                        />
                        <ListItem
                            title={strings('settings.about.contactSupportTitle')}
                            subtitle={strings('settings.about.contactSupportSubtitle')}
                            iconType="contactSupport"
                            onPress={this.handleSupport}
                            rightContent="arrow"
                            last
                        />
                        <ListItem
                            title={strings('settings.about.contactSupportEmail')}
                            subtitle={strings('settings.about.contactSupportEmailSubtitle') + '\n' + BlocksoftExternalSettings.getStatic('SUPPORT_EMAIL')}
                            iconType="supportMail"
                            onPress={this.handleSupportEmail}
                            rightContent="arrow"
                        />
                    </View>

                    <View style={{ marginVertical: GRID_SIZE }}>
                        <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{strings('settings.about.information')}</Text>
                        <ListItem
                            title={strings('settings.about.privacy')}
                            iconType="privacyPolicy"
                            onPress={this.handlePrivacyPolicyPress}
                            rightContent="arrow"
                        />
                        <ListItem
                            title={strings('settings.about.terms')}
                            iconType="termsOfUse"
                            onPress={this.handleTermsPress}
                            rightContent="arrow"
                            last
                        />
                    </View>

                    <View style={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE / 2 }}>
                        <View style={styles.socialLinks}>
                            {SOCIAL_LINKS.slice(0, 4).map(item => (
                                <RoundButton
                                    containerStyle={styles.socialButtonContainer}
                                    size={44}
                                    style={styles.socialButton}
                                    type={item.name}
                                    key={item.name}
                                    noTitle
                                    onPress={() => this.openSocial(item.link)}
                                />
                            ))}
                        </View>
                        <View style={styles.socialLinks}>
                            {SOCIAL_LINKS.slice(4).map(item => (
                                <RoundButton
                                    containerStyle={styles.socialButtonContainer}
                                    size={44}
                                    style={styles.socialButton}
                                    type={item.name}
                                    key={item.name}
                                    noTitle
                                    onPress={() => this.openSocial(item.link)}
                                />
                            ))}
                        </View>
                    </View>

                    <Text style={[styles.copyright, { color: colors.common.text3, marginVertical: GRID_SIZE }]}>{strings('settings.about.copyright', { currentYear })}</Text>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

AboutScreen.contextType = ThemeContext

export default AboutScreen


const { width: SCREEN_WIDTH } = Dimensions.get('window')
const LOGO_WIDTH = SCREEN_WIDTH / 7
const LOGO_HEIGHT = LOGO_WIDTH * 1.2

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    topContent: {
        alignItems: 'center'
    },
    logo: {
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT,
        marginBottom: 16
    },
    version: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 4
    },
    commitHash: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'center',
    },
    socialLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButton: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 6
        },

        elevation: 12
    },
    socialButtonContainer: {
        marginHorizontal: 12,
        marginVertical: 8
    },
    copyright: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 12,
        lineHeight: 12,
        textAlign: 'center',
        textTransform: 'uppercase',
    }
})
