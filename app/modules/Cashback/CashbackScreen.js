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
    RefreshControl,
    FlatList, ImageBackground, Image, LayoutAnimation, Platform, UIManager
} from 'react-native'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'


import CustomIcon from '@app/components/elements/CustomIcon'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import { ThemeContext } from '@app/theme/ThemeProvider'
import DetailsContent from './elements/Details'
import HowItWorks from './elements/HowItWorks'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import UpdateCashBackDataDaemon from '@app/daemons/back/UpdateCashBackDataDaemon'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import NavStore from '@app/components/navigation/NavStore'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import Tabs from '@app/components/elements/new/Tabs'
import CashbackData from './elements/CashbackData'
import { ProgressCircle } from 'react-native-svg-charts'
import { ProgressBar } from 'react-native-paper'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import UtilsService from '@app/services/UI/PrettyNumber/UtilsService'
import TextInput from '@app/components/elements/new/TextInput'
import Validator from '@app/services/UI/Validator/Validator'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'

class CashbackScreen extends React.PureComponent {

    state = {
        selectedContent: null,
        promoCode: '',
        inviteLink: '',
        inviteLinkError: false,
        refreshing: false,
        selectedTitle: null,

        tabs: [
            {
                title: strings('notifications.tabInvite'),
                index: 0,
                active: false
            },
            {
                title: strings('notifications.tabInfo'),
                index: 1,
                active: true
            },
            {
                title: strings('notifications.tabFaq'),
                index: 2,
                active: false
            }
        ]
    }

    cashbackCurrency = 'USDT'

    handleWithdrawCashback = () => {
        const { cashbackBalance = 0, minWithdraw } = this.props.cashbackStore.dataFromApi

        if (cashbackBalance < minWithdraw) {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.exchange.sorry'),
                description: `${strings('cashback.minWithdraw')} ${minWithdraw} ${this.cashbackCurrency}`
            })
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.titles.attention'),
                description: strings('cashback.performWithdraw'),
                component: this.renderTelegramComponent
            })
        }
    }
    triggerEditing = () => {
        const nextValue = !this.state.isEditing
        this.setState(() => ({ isEditing: nextValue, inviteLink: '' }))
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.inviteLink) {
            this.setState(() => ({ inviteLink: nextProps.inviteLink, inviteLinkError: false }), () => {
                this.handleSubmitInviteLink()
            })
        }
    }

    handleChangeInviteLink = (value) => {
        this.setState(() => ({ inviteLink: value, inviteLinkError: false }))
    }

    handleQrCode = () => {
        setQRConfig({
            flowType: QRCodeScannerFlowTypes.CASHBACK_LINK, callback: (data) => {
                try {
                    this.setState(() => ({ inviteLink: data.qrCashbackLink, inviteLinkError: false }), () => {
                        this.handleSubmitInviteLink()
                    })
                } catch (e) {
                    Log.log('QRCodeScannerScreen callback error ' + e.message)
                    Toast.setMessage(e.message).show()
                }
                NavStore.goBack()
            }
        })
        NavStore.goNext('QRCodeScannerScreen')
    }

    handleSubmitInviteLink = async () => {
        const { inviteLink } = this.state
        if (!inviteLink) {
            return
        }

        let cashbackLink = this.props.cashbackStore.dataFromApi.cashbackLink || false
        if (!cashbackLink || cashbackLink === '') {
            cashbackLink = this.props.cashbackStore.cashbackLink || ''
        }

        const validationResult = await Validator.arrayValidation([{
            type: 'CASHBACK_LINK',
            value: inviteLink
        }])

        if (validationResult.status !== 'success') {
            this.setState(() => ({ inviteLinkError: true }))
            return
        }

        const tmp = inviteLink.split('/')
        let cashbackParentToken = inviteLink
        if (tmp.length > 0) {
            cashbackParentToken = tmp[tmp.length - 1]
        }
        if (!cashbackParentToken || cashbackParentToken === '') {
            return
        }

        if (cashbackLink === inviteLink
            || cashbackParentToken === this.props.cashbackToken
            || cashbackParentToken === this.props.cashbackStore.dataFromApi.cashbackToken
            || cashbackParentToken === this.props.cashbackStore.dataFromApi.customToken
        ) {
            Log.log('CashbackLink inputParent for ' + cashbackLink + ' is equal ' + inviteLink)
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.cashbackLinkEqualModal.description', { link: inviteLink })
            })
            this.setState(() => ({ inviteLinkError: true }))
            return
        }

        Log.log('CashbackLink inputParent for  ' + cashbackLink + ' res ', validationResult)

        try {
            await CashBackUtils.setParentToken(cashbackParentToken)
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.walletBackup.success'),
                description: strings('modal.cashbackTokenLinkModal.success.description')
            })
        } catch (e) {
            Log.err('CashBackScreen.Details handleSubmitInviteLink error ' + e.message)
        }
    }

    componentDidMount() {

        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true)
            }
        }

        const { cashbackStore } = this.props

        const time = cashbackStore.dataFromApi.time || false
        let timePrep
        if (time) {
            const timeDate = new Date(time)
            timePrep = timeDate.toLocaleTimeString()
        }

        const cashbackBalance = cashbackStore.dataFromApi.cashbackBalance || '0.00'
        const cpaBalance = cashbackStore.dataFromApi.cpaBalance || '0.00'

        const cashbackToken = cashbackStore.dataFromApi.cashbackToken || cashbackStore.cashbackToken
        const cashbackLinkTitle = cashbackStore.dataFromApi.customToken || false

        let cashbackParentToken = cashbackStore.dataFromApi.parentToken || false
        if (!cashbackParentToken) {
            cashbackParentToken = cashbackStore.parentToken || ''
        }
        if (cashbackParentToken === cashbackToken || cashbackParentToken === cashbackLinkTitle) {
            cashbackParentToken = ''
        }

        const {
            colors,
        } = this.context

        const cashbackCondition = cashbackBalance >= 2

        const cpaCondition = cpaBalance >= 100

        const cashbackProcent = UtilsService.cutNumber(cashbackBalance / 2 * 100, 2)

        const cpaProcent = UtilsService.cutNumber(UtilsService.getPercent(cpaBalance, 100), 2)

        const flatListData = [

            {
                title: strings('cashback.availableCashBack'),
                subTitle: 'updated ' + timePrep,
                balance: cashbackBalance + cpaBalance,
                ExtraViewData: () => {
                    return (
                        <View>
                            {!cashbackParentToken ?
                                <TextInput
                                    autoCapitalize='none'
                                    containerStyle={{ marginBottom: 10,  width: 280, marginLeft: 15 }}
                                    placeholder={strings('cashback.enterPromoCode')}
                                    onChangeText={this.handleChangeInviteLink}
                                    value={this.state.inviteLink}
                                    qr={true}
                                    qrCallback={this.handleQrCode}
                                    inputStyle={this.state.inviteLinkError && { color: colors.cashback.token }}
                                    onBlur={this.handleSubmitInviteLink}
                                /> :
                                <View>
                                    <Text style={styles.inviteText}>{'Invited:'}</Text>
                                    <Text style={[styles.inviteToken, { color: this.context.colors.common.text1 }]}>{cashbackParentToken}</Text>
                                </View>}
                        </View>
                    )
                }
            },
            {
                title: strings('cashback.balanceTitle'),
                subTitle: 'Cashback',
                balance: cashbackBalance,
                ExtraViewData: () => {
                    return (
                        <View style={cashbackCondition ? styles.progressBarContainerFull : styles.progressBarContainer}>
                            <View>
                                <Text style={styles.withdrawInfo}>{strings('cashback.toWithdraw')}</Text>
                                <View style={cashbackCondition ? styles.progressBarEnd : styles.progressBarInProg}>
                                    <ProgressBar progress={cashbackBalance / 2} style={[styles.progressBarLocation, cashbackCondition ? styles.progressBarEnd : styles.progressBarInProg, { backgroundColor: this.context.colors.cashback.chartBg }]} color={this.context.colors.cashback.token} />
                                    <View>
                                        <Text style={styles.progressProcent}>{cashbackBalance + ' / 2 ' + this.cashbackCurrency}</Text>
                                    </View>
                                </View>
                            </View>
                            {cashbackCondition ?
                                <TouchableOpacity
                                    activeOpacity={0.6}
                                    style={[styles.withdrawButton, { borderColor: this.context.colors.common.text3 }]}
                                    onPress={this.handleWithdrawCashback}
                                >
                                    <Text style={[styles.withdrawButtonText, { color: this.context.colors.common.text3 }]}>{strings('cashback.withdraw')}</Text>
                                </TouchableOpacity> : null}
                        </View>
                    )
                }
            },
            {
                title: strings('cashback.balanceTitle'),
                subTitle: 'Cpa',
                balance: cpaBalance,

                ExtraViewData: () => {
                    return (
                        <View style={cpaCondition ? styles.progressBarContainerFull : styles.progressBarContainer}>
                            <View>
                                <Text style={styles.withdrawInfo}>{strings('cashback.toWithdraw')}</Text>
                                <View style={cashbackCondition ? styles.progressBarEnd : styles.progressBarInProg}>
                                    <ProgressBar progress={cpaBalance / 100} style={[styles.progressBarLocation, cpaCondition ? styles.progressBarEnd : styles.progressBarInProg, { backgroundColor: this.context.colors.cashback.chartBg }]} color={this.context.colors.cashback.token} />
                                    <View>
                                        <Text style={styles.progressProcent}>{cpaBalance + ' / 100 ' + this.cashbackCurrency}</Text>
                                    </View>
                                </View>
                            </View>
                            {cpaCondition ?
                                <TouchableOpacity
                                    activeOpacity={0.6}
                                    style={[styles.withdrawButton, { borderColor: this.context.colors.common.text3 }]}
                                    onPress={this.handleWithdrawCashback}
                                >
                                    <Text style={[styles.withdrawButtonText, { color: this.context.colors.common.text3 }]}>{strings('cashback.withdraw')}</Text>
                                </TouchableOpacity> : null}
                        </View>
                    )
                }
            },
            {
                title: strings('cashback.wholeBalance'),
                subTitle: 'updated ' + timePrep,
                balance: cashbackBalance + cpaBalance,
                ExtraViewData: () => {
                    return (
                        <View style={styles.circleView}>
                            <View style={[styles.circleBox, { borderRightWidth: 1, borderRightColor: this.context.colors.cashback.borderColor }]}>
                                <View>
                                    <ProgressCircle style={styles.progressCircle} strokeWidth={3.5} progress={cashbackBalance / 2} backgroundColor={this.context.colors.cashback.chartBg} progressColor={this.context.colors.cashback.token} />
                                </View>
                                <View style={styles.circleInfo}>
                                    <Text style={[styles.circleTitle, { color: this.context.colors.common.text3 }]}>{'Cashback'}</Text>
                                    <Text style={styles.circleProcent}>{(cashbackProcent >= 100 ? '100' : cashbackProcent) + ' %'}</Text>
                                </View>
                            </View>
                            <View style={styles.circleBox}>
                                <View>
                                    <ProgressCircle style={styles.progressCircle} strokeWidth={3.5} progress={cpaBalance / 100} backgroundColor={this.context.colors.cashback.chartBg} progressColor={this.context.colors.cashback.token} />
                                </View>
                                <View style={styles.circleInfo}>
                                    <Text style={[styles.circleTitle, { color: this.context.colors.common.text3 }]}>{'CPA'}</Text>
                                    <Text style={styles.circleProcent}>{(cpaProcent >= 100 ? '100' : cpaProcent) + ' %'}</Text>
                                </View>
                            </View>
                        </View>
                    )
                }
            }
        ]

        this.setState(() => ({
            flatListData: flatListData
        }))

    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        const qrCodeData = NavStore.getParamWrapper(this, 'qrData')
        if (qrCodeData && typeof qrCodeData.qrCashbackLink !== 'undefined' && qrCodeData.qrCashbackLink) {
            if (prevState.inviteLink !== qrCodeData.qrCashbackLink) {
                this.setState(() => ({ inviteLink: qrCodeData.qrCashbackLink }))
            }
        }
    }

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
            refreshing: true
        })

        await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })

        this.setState({
            refreshing: false
        })
    }

    renderTabs = () => <Tabs tabs={this.state.tabs} changeTab={this.handleChangeTab} />

    handleChangeTab = (newTab) => {
        const newTabs = this.state.tabs.map(tab => ({
            ...tab,
            active: tab.index === newTab.index
        }))
        this.setState(() => ({ tabs: newTabs }))
    }

    renderFlatListItem = ({ item, index }) => {
        return (
            <CashbackData
                data={item}
                margin={this.state.flatListData.length !== index + 1}
            />
        )
    }

    render() {
        MarketingAnalytics.setCurrentScreen('CashBackScreen')

        const {
            colors,
            GRID_SIZE
        } = this.context
        const {
            selectedTitle
        } = this.state
        const { cashbackStore } = this.props

        const cashbackBalance = cashbackStore.dataFromApi.cashbackBalance || '0.00'
        const cpaBalance = cashbackStore.dataFromApi.cpaBalance || '0.00'

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
                title={strings('cashback.pageTitle')}
                ExtraView={this.renderTabs}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { paddingVertical: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE }]}
                    keyboardShouldPersistTaps='handled'
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.text1}
                        />
                    }>
                    {this.state.tabs[0].active && (
                        <>
                            <ImageBackground
                                style={styles.qrBg}
                                source={require('@assets/images/qrBG.png')}
                            >
                                <Text style={[styles.pageSubtitle, { color: colors.common.text1, marginHorizontal: GRID_SIZE / 2 }]}>{strings('cashback.pageSubtitle')}</Text>
                                <View style={styles.PageSubtitleTextBox}>
                                    <Text style={styles.pageSubtitleText}>{strings('cashback.pageSubtitleText')}</Text>
                                    <Text style={styles.pageSubtitleProcent}>{'30%'}</Text>
                                </View>
                                <Image style={styles.picProcent} source={require('@assets/images/picProcent.png')} />
                                <TouchableOpacity
                                    style={[styles.qrCodeContainer, { marginVertical: GRID_SIZE / 2, marginHorizontal: GRID_SIZE / 2.5 }]}
                                    onPress={() => this.copyToClip(cashbackLink)}
                                    activeOpacity={0.8}
                                >
                                    <QrCodeBox
                                        value={cashbackLink}
                                        size={120}
                                        color={colors.cashback.qrCode}
                                        backgroundColor='transparent'
                                        onError={this.handleRenderQrError}
                                        style={styles.qrCode}
                                    />
                                    <Text style={[styles.qrCodeTokenString, {
                                        color: colors.cashback.token,
                                        marginTop: GRID_SIZE * 0.75
                                    }]}>{cashbackLinkTitle}
                                        <CustomIcon name='copy' size={18} color={colors.cashback.token} /></Text>
                                </TouchableOpacity>
                            </ImageBackground>
                        </>
                    )}
                    {this.state.tabs[1].active && (
                        <>
                            <FlatList
                                data={this.state.flatListData}
                                keyExtractor={({ index }) => index}
                                horizontal={true}
                                renderItem={({ item, index }) => this.renderFlatListItem({ item, index })}
                                showsHorizontalScrollIndicator={false}
                            />
                            <View style={styles.switchableTabs}>
                                <TouchableOpacity style={styles.switchableTabsLocation} onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
                                    this.setState({ selectedTitle: this.state.selectedTitle === 'CASHBACK' ? null : 'CASHBACK' })
                                }
                                }>
                                    <View style={styles.switchableTabsContainer}>
                                        <View>
                                            <ProgressCircle style={styles.switchableCircle} strokeWidth={3.5} progress={cashbackBalance / 2} backgroundColor={colors.cashback.chartBg} progressColor={colors.cashback.token} />
                                        </View>
                                        <View style={styles.textContainer}>
                                            <Text style={[styles.switchableTabsText, { color: colors.common.text3 }]}>{'Cashback'}</Text>
                                            <Text style={[styles.switchableTabsBalance]}>{cashbackBalance + ' ' + this.cashbackCurrency}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <CustomIcon style={styles.switchableTabsIcons} name={selectedTitle === 'CASHBACK' ? 'close' : 'coinSettings'} size={20} color={colors.common.text1} />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.switchableTabsLocation, { marginBottom: 20 }]} onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
                                    this.setState({ selectedTitle: this.state.selectedTitle === 'CPA' ? null : 'CPA' })
                                }}>
                                    <View style={styles.switchableTabsContainer}>
                                        <View>
                                            <ProgressCircle style={styles.switchableCircle} strokeWidth={3.5} progress={cpaBalance / 100} backgroundColor={colors.cashback.chartBg} progressColor={colors.cashback.token} />
                                        </View>
                                        <View style={styles.textContainer}>
                                            <Text style={[styles.switchableTabsText, { color: colors.common.text3 }]}>{'CPA'}</Text>
                                            <Text style={[styles.switchableTabsBalance]}>{cpaBalance + ' ' + this.cashbackCurrency}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <CustomIcon style={styles.switchableTabsIcons} name={selectedTitle === 'CPA' ? 'close' : 'coinSettings'} size={20} color={colors.common.text1} />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {this.renderContent()}
                        </>
                    )}

                    {this.state.tabs[2].active && (
                        <HowItWorks />
                    )}

                </ScrollView>
            </ScreenWrapper>
        )
    }

    renderContent = () => {
        const { selectedTitle } = this.state

        const { cashbackStore } = this.props

        const cashbackLinkTitle = cashbackStore.dataFromApi.customToken || false
        const cashbackToken = cashbackStore.dataFromApi.cashbackToken || cashbackStore.cashbackToken

        const overalVolume = cashbackStore.dataFromApi.overalVolume || 0
        let overalPrep = 1 * BlocksoftPrettyNumbers.makeCut(overalVolume, 6).justCutted

        let cpaLevel1 = cashbackStore.dataFromApi.cpaLevel1 || 0
        let cpaLevel2 = cashbackStore.dataFromApi.cpaLevel2 || 0
        let cpaLevel3 = cashbackStore.dataFromApi.cpaLevel3 || 0

        let invitedUsers = cashbackStore.dataFromApi.invitedUsers || 0
        let level2Users = cashbackStore.dataFromApi.level2Users || 0

        let cashbackToShow = false
        if (cashbackStore.dataFromApi.cashbackToken !== cashbackStore.dataFromApi.customToken) {
            cashbackToShow = cashbackStore.dataFromApi.cashbackToken
        }

        let cashbackParentToken = cashbackStore.dataFromApi.parentToken || false
        if (!cashbackParentToken || cashbackParentToken === null) {
            cashbackParentToken = cashbackStore.parentToken || ''
        }
        if (cashbackParentToken === cashbackToken || cashbackParentToken === cashbackToShow || cashbackParentToken === cashbackLinkTitle) {
            cashbackParentToken = ''
        }


        if (typeof cashbackStore.dataFromApi.cashbackToken === 'undefined' || cashbackStore.dataFromApi.cashbackToken !== cashbackStore.cashbackToken) {
            invitedUsers = '?'
            level2Users = '?'
            overalPrep = '?'
            cpaLevel1 = '?'
            cpaLevel2 = '?'
            cpaLevel3 = '?'
        }

        MarketingEvent.logEvent('taki_cashback_2_render', {
            cashbackLink: cashbackStore.dataFromApi.cashbackLink || cashbackStore.cashbackLink || '',
            invitedUsers,
            level2Users,
            overalPrep,
            cpaLevel1,
            cpaLevel2,
            cpaLevel3
        })

        return (
            <DetailsContent
                selectedTitle={selectedTitle}
                overalPrep={overalPrep}
                invitedUsers={invitedUsers}
                level2Users={level2Users}
                cpaLevel1={cpaLevel1}
                cpaLevel2={cpaLevel2}
                cpaLevel3={cpaLevel3}
                inviteLink={this.state.inviteLink}
            />
        )
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
        flexGrow: 1
    },
    pageSubtitle: {
        zIndex: 2,
        flex: 1,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 25,
        lineHeight: 27,
        width: 200,
        height: 110,
        position: 'absolute',
        top: -115
    },
    PageSubtitleTextBox: {
        position: 'absolute',
        zIndex: 2,
        top: -100,
        left: 225,
        width: 85
    },
    pageSubtitleProcent: {
        fontFamily: 'Montserrat-Medium',
        fontStyle: 'normal',
        textAlign: 'center',
        fontSize: 40,
        color: '#ffffff'
    },
    pageSubtitleText: {
        fontFamily: 'Montserrat-Medium',
        fontStyle: 'normal',
        textAlign: 'center',
        fontSize: 25,
        color: '#ffffff'
    },
    qrCodeContainer: {
        flex: 1,
        alignItems: 'center',
        left: 110,
        position: 'absolute',
        top: 30
    },
    qrCode: {
        alignSelf: 'center'
    },
    qrCodeTokenString: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 20,
        lineHeight: 22,
        textAlign: 'center'
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    buttonContainer: {
        flex: 1
    },
    qrBg: {
        flex: 1,
        justifyContent: 'center',
        alignSelf: 'center',
        width: 400,
        height: 400,
        position: 'relative',
        marginTop: 150
    },
    picProcent: {
        position: 'absolute',
        top: -150,
        left: 190,
        width: 200,
        height: 200,
        resizeMode: 'contain'
    },
    inviteText: {
        textAlign: 'center',
        fontFamily: 'Montserrat-SemiBold',
        marginTop: 5,
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#999999',
        lineHeight: 12,
        letterSpacing: 0.5
    },
    inviteToken: {
        marginTop: 6,
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1
    },
    withdrawInfo: {
        marginLeft: 22,
        fontSize: 11,
        fontFamily: 'Montserrat-SemiBold',
        textTransform: 'uppercase',
        color: '#999999',
        lineHeight: 11,
        letterSpacing: 0.5
    },
    progressCircle: {
        height: 34,
        width: 34
    },
    circleView: {
        flexDirection: 'row',
        marginTop: 10
    },
    circleTitle: {
        marginTop: 3,
        fontSize: 14,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 14
    },
    circleBox: {
        flex: 1,
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginLeft: 17
    },
    circleProcent: {
        marginTop: 4,
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 15,
        lineHeight: 15,
        letterSpacing: 1.75,
        color: '#999999'
    },
    circleInfo: {
        flex: 1,
        marginLeft: 9
    },
    progressBarLocation: {
        borderRadius: 5,
        height: 6,
        marginTop: 5
    },
    progressBarInProg: {
        marginLeft: 11,
        width: 260
    },
    progressBarEnd: {
        marginLeft: 11,
        width: 150
    },
    progressProcent: {
        marginLeft: 11,
        marginTop: 5,
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 16,
        lineHeight: 18,
        letterSpacing: 0.7,
        color: '#999999'
    },
    progressBarContainer: {
        marginTop: 5
    },
    progressBarContainerFull: {
        marginTop: 5,
        flexDirection: 'row'
    },
    switchableTabs: {
        marginBottom: 5,
        marginTop: 10
    },
    switchableTabsText: {
        fontSize: 20,
        lineHeight: 20,
        fontFamily: 'Montserrat-SemiBold',
        marginBottom: 2
    },
    switchableTabsContainer: {
        marginTop: 2,
        flexDirection: 'row'
    },
    switchableTabsBalance: {
        fontSize: 16,
        lineHeight: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999',
        letterSpacing: 1
    },
    switchableCircle: {
        width: 50,
        height: 50
    },
    textContainer: {
        marginLeft: 12,
        marginTop: 6
    },
    switchableTabsLocation: {
        position: 'relative'
    },
    switchableTabsIcons: {
        left: 325,
        top: -38
    },
    withdrawButton: {
        marginTop: 5,
        marginLeft: 25,
        borderRadius: 6,
        borderWidth: 1.5,
        paddingVertical: 8,
        paddingHorizontal: 12,
        width: 95,
        height: 30
    },
    withdrawButtonText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 10,
        lineHeight: 12,
        letterSpacing: 0.5,
        textAlign: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase'
    },


})
