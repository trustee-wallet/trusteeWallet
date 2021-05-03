/**
 * @version 0.42
 * @description ksu jumping
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl
} from 'react-native'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'


import CustomIcon from '@app/components/elements/CustomIcon'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import RoundButton from '@app/components/elements/new/buttons/RoundButton'
import PromoCodeContent from './elements/PromoCode'
import DetailsContent from './elements/Details'
import HowItWorks from './elements/HowItWorks'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import UpdateCashBackDataDaemon from '@app/daemons/back/UpdateCashBackDataDaemon'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import NavStore from '@app/components/navigation/NavStore'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'


class CashbackScreen extends React.PureComponent {
    state = {
        selectedContent: null,
        promoCode: '',
        inviteLink: '',
        refreshing: false
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const qrCodeData = NavStore.getParamWrapper(this, 'qrData')
        if (qrCodeData && typeof qrCodeData.qrCashbackLink !== 'undefined' && qrCodeData.qrCashbackLink) {
            if (prevState.inviteLink !== qrCodeData.qrCashbackLink) {
                this.setState(() => ({ inviteLink: qrCodeData.qrCashbackLink }))
            }
        }
    }



    handleBack = () => { NavStore.reset('HomeScreen') }

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

    handleRefresh = async () => {
        this.setState({
            refreshing: true,
        })

        await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })

        this.setState({
            refreshing: false
        })
    }

    render() {
        MarketingAnalytics.setCurrentScreen('CashBackScreen')
        const {
            colors,
            GRID_SIZE,
        } = this.context
        const { selectedContent } = this.state
        const { cashbackStore } = this.props

        let cashbackLink = cashbackStore.dataFromApi.cashbackLink || false
        let cashbackLinkTitle = cashbackStore.dataFromApi.customToken || false
        if (!cashbackLink || cashbackLink === '') {
            cashbackLink = cashbackStore.cashbackLink || ''
        }
        if (!cashbackLinkTitle || cashbackLinkTitle === '') {
            cashbackLinkTitle = cashbackStore.cashbackLinkTitle || ''
        }

        return (
            <ScreenWrapper
                rightType="close"
                rightAction={this.handleBack}
                title={strings('cashback.pageTitle')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { paddingVertical: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE }]}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.text1}
                        />
                    }>
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
                            backgroundColor={colors.cashback.background}
                            onError={this.handleRenderQrError}
                            style={styles.qrCode}
                        />
                        <Text style={[styles.qrCodeTokenString, { color: colors.cashback.token, marginTop: GRID_SIZE * 0.75 }]}>{cashbackLinkTitle} <CustomIcon name="copy" size={18} color={colors.cashback.token} /></Text>
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
            </ScreenWrapper >
        )
    }

    renderContent = () => {
        const { selectedContent } = this.state

        if (selectedContent === 'promo') {
            return <PromoCodeContent />
        }
        if (selectedContent === 'details') {
            const { cashbackStore } = this.props
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

            if (typeof cashbackStore.dataFromApi.cashbackToken === 'undefined' || cashbackStore.dataFromApi.cashbackToken !== cashbackStore.cashbackToken) {
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
        cashbackStore: getCashBackData(state)
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
        alignContent: 'center',
        alignItems: 'center',
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
