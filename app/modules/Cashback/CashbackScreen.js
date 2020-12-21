
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native'
import firebase from 'react-native-firebase'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import NavStore from '../../components/navigation/NavStore'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

import { strings } from '../../services/i18n'
import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import Toast from '../../services/UI/Toast/Toast'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'
import prettyShare from '../../services/UI/PrettyShare/PrettyShare'

import CashBackSettings from '../../appstores/Stores/CashBack/CashBackSettings'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'

import CustomIcon from '../../components/elements/CustomIcon'
import QrCodeBox from '../../components/elements/QrCodeBox'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import RoundButton from '../../components/elements/new/buttons/RoundButton'
import PromoCodeContent from './elements/PromoCode'
import DetailsContent from './elements/Details'
import HowItWorks from './elements/HowItWorks'


class CashbackScreen extends React.Component {
    state = {
        headerHeight: 0,
        selectedContent: null,
        promoCode: '',
        inviteLink: ''
    }

    navigationListener;

    componentDidMount() {
        this.navigationListener = this.props.navigation.addListener('didFocus', () => {
            const qrCodeData = this.props.navigation.getParam('qrCashbackLink', null)
            if (qrCodeData) this.setState(() => ({ inviteLink: qrCodeData }))
        })
    }

    componentWillUnmount() {
        if (typeof this.navigationListener === 'function') this.navigationListener()
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleBack = () => { this.props.navigation.goBack() }

    handleRenderQrError = (e) => {
        if (e.message !== 'No input text') Log.err('CashbackScreen QRCode error ' + e.message)
    }

    copyToClip = (token) => {
        MarketingEvent.logEvent('taki_cashback_3_copyToClip', { cashbackLink: token })
        copyToClipboard(token)
        Toast.setMessage(strings('toast.copied')).show()
    }

    handlePressShare = (cashbackLink) => {
        this.setState(() => ({ selectedContent: null }))
        const shareOptions = {
            title: strings('cashback.shareTitle'),
            message: strings('cashback.shareMessage'),
            url: cashbackLink
        }
        MarketingEvent.logEvent('taki_cashback_3_copyToMoreStart', { cashbackLink })
        prettyShare(shareOptions, 'taki_cashback_4_copyToMoreFinish')
    }

    handlePressPromo = () => {
        const { selectedContent } = this.state
        this.setState(() => ({ selectedContent: selectedContent === 'promo' ? null : 'promo' }))
    }

    handlePressDetails = () => {
        const { selectedContent } = this.state
        this.setState(() => ({ selectedContent: selectedContent === 'details' ? null : 'details' }))
    }

    render() {
        firebase.analytics().setCurrentScreen('CashBackScreen')
        const {
            colors,
            GRID_SIZE,
        } = this.context
        const { headerHeight, selectedContent } = this.state
        const { cashbackStore, walletHash } = this.props

        let cashbackLink = cashbackStore.dataFromApi.cashbackLink || false
        let cashbackLinkNotice = !cashbackLink
        if (!cashbackLink || cashbackLink === '') {
            cashbackLink = cashbackStore.cashbackLink || ''
            cashbackLinkNotice = !!cashbackLink
        }

        const savedAuthHash = cashbackStore.dataFromApi.authHash || ''
        if (savedAuthHash !== walletHash) {
            cashbackLink = CashBackSettings.getLink(CashBackUtils.getWalletToken())
        }

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    rightType="close"
                    rightAction={this.handleBack}
                    title={strings('cashback.pageTitle')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <KeyboardAwareView>
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollViewContent, { paddingVertical: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE }]}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={[styles.pageSubtitle, { color: colors.common.text1, marginHorizontal: GRID_SIZE / 2 }]}>{strings('cashback.pageSubtitle')}</Text>
                        <TouchableOpacity
                            style={[styles.qrCodeContainer, { marginVertical: GRID_SIZE }]}
                            onPress={() => this.copyToClip(cashbackLink)}
                            activeOpacity={0.8}
                        >
                            <QrCodeBox
                                value={cashbackLink}
                                size={150}
                                color={colors.cashback.qrCode}
                                backgroundColor={colors.common.background}
                                onError={this.handleRenderQrError}
                                style={styles.qrCode}
                            />
                            <Text style={[styles.qrCodeTokenString, { color: colors.cashback.token, marginTop: GRID_SIZE * 0.75 }]}>{cashbackStore.dataFromApi.customToken} <CustomIcon name="copy" size={18} color={colors.cashback.token} /></Text>
                        </TouchableOpacity>

                        <View style={[styles.buttonsRow, { margin: GRID_SIZE * 2, marginTop: GRID_SIZE }]}>
                            <RoundButton
                                type="share"
                                size={54}
                                onPress={() => this.handlePressShare(cashbackLink)}
                                containerStyle={styles.buttonContainer}
                                title={!selectedContent && strings('cashback.shareButton')}
                            />
                            <RoundButton
                                type={selectedContent === 'promo' ? 'close' : 'promo'}
                                size={54}
                                onPress={this.handlePressPromo}
                                containerStyle={styles.buttonContainer}
                                title={!selectedContent && strings('cashback.promoButton')}
                            />
                            <RoundButton
                                type={selectedContent === 'details' ? 'close' : 'details'}
                                size={54}
                                onPress={this.handlePressDetails}
                                containerStyle={styles.buttonContainer}
                                title={!selectedContent && strings('cashback.detailsButton')}
                            />
                        </View>

                        {this.renderContent()}

                        <HowItWorks />
                    </ScrollView>
                </SafeAreaView>
                </KeyboardAwareView>
            </View>
        )
    }

    renderContent = () => {
        const { selectedContent } = this.state

        if (selectedContent === 'promo') {
            return <PromoCodeContent />
        }
        if (selectedContent === 'details') {
            const { cashbackStore, walletHash } = this.props
            const overalVolume = cashbackStore.dataFromApi.overalVolume || 0
            let overalPrep = 1 * BlocksoftPrettyNumbers.makeCut(overalVolume, 6).justCutted

            let cashbackBalance = cashbackStore.dataFromApi.cashbackBalance || 0
            let totalCashbackBalance = cashbackStore.dataFromApi.totalCashbackBalance || 0
            let balancePrep = 1 * BlocksoftPrettyNumbers.makeCut(cashbackBalance, 6).justCutted

            let invitedUsers = cashbackStore.dataFromApi.invitedUsers || 0
            let level2Users = cashbackStore.dataFromApi.level2Users || 0

            let cashbackParentToken = cashbackStore.dataFromApi.parentToken || false
            let cashbackParentNotice = false
            if (!cashbackParentToken || cashbackParentToken === null) {
                cashbackParentToken = cashbackStore.parentToken || ''
                cashbackParentNotice = !!cashbackParentToken
            }
            let cashbackToShow = false
            if (cashbackStore.dataFromApi.cashbackToken !== cashbackStore.dataFromApi.customToken) {
                cashbackToShow = cashbackStore.dataFromApi.cashbackToken
            }

            const time = cashbackStore.dataFromApi.time || false
            let timePrep
            if (time) {
                const timeDate = new Date(time)
                timePrep = timeDate.toLocaleTimeString()
            }


            const savedAuthHash = cashbackStore.dataFromApi.authHash || ''
            if (savedAuthHash !== walletHash) {
                invitedUsers = '?'
                level2Users = '?'
                overalPrep = '?'
                cashbackBalance = '?'
                totalCashbackBalance = '?'
            }

            MarketingEvent.logEvent('taki_cashback_2_render', {
                cashbackLink: cashbackStore.dataFromApi.cashbackLink || cashbackStore.cashbackLink || '',
                invitedUsers,
                level2Users,
                cashbackBalance,
                totalCashbackBalance,
                overalPrep,
                cashbackParentToken
            })

            return (
                <DetailsContent
                    currentBalance={cashbackBalance}
                    wholeBalance={totalCashbackBalance}
                    overalPrep={overalPrep}
                    invitedUsers={invitedUsers}
                    level2Users={level2Users}
                    cashbackParentToken={cashbackParentToken}
                    cashbackToShow={cashbackToShow}
                    inviteLink={this.state.inviteLink}
                    updatedTime={timePrep}
                />
            )
        }

        return null
    }
}

const mapStateToProps = (state) => {
    return {
        cashbackStore: state.cashBackStore,
        walletHash: state.mainStore.selectedWallet.walletHash
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

CashbackScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(CashbackScreen)

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
    pageSubtitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 22,
        textAlign: 'center'
    },
    qrCodeContainer: {
        alignContent: 'center'
    },
    qrCode: {
        alignSelf: 'center'
    },
    qrCodeTokenString: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 22,
        textAlign: 'center'
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    buttonContainer: {
        flex: 1
    }
})
