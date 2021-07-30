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
    FlatList, ImageBackground, Image
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


class CashbackScreen extends React.PureComponent {
    state = {
        selectedContent: null,
        promoCode: '',
        inviteLink: '',
        refreshing: false,

        tabs: [
            {
                title: strings('notifications.tabAll'),
                index: 0,
                active: true
            },
            {
                title: strings('notifications.tabNews'),
                index: 1,
                active: false
            },
            {
                title: strings('notifications.tabNews'),
                index: 2,
                active: false
            },
        ],

        flatlistData: []
    }

    componentDidMount() {

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
        if (!cashbackParentToken || cashbackParentToken === null) {
            cashbackParentToken = cashbackStore.parentToken || ''
        }
        if (cashbackParentToken === cashbackToken || cashbackParentToken === cashbackLinkTitle) {
            cashbackParentToken = ''
        }

        let flatlistData = [
            {
                title: strings('notifications.tabAll'),
                subTitle: timePrep,
                balance: cashbackBalance,
                ExtraViewData: () => {
                    return (
                        <View>
                            <Text>{'Invited'}</Text>
                            <Text>{cashbackParentToken}</Text>
                        </View>
                    )
                }
            },
            {
                title: strings('notifications.tabAll'),
                subTitle: 'Murzik',
                balance: cashbackBalance,
                ExtraViewData: () => {
                    return (
                        <View style={{ backgroundColor: 'red' }}>
                            <Text>{'heisdklf kldsjfklsd jlfk s'}</Text>
                        </View>
                    )
                }
            },
            {
                title: strings('notifications.tabAll'),
                subTitle: 'Murzik',
                balance: cpaBalance,
                ExtraViewData: () => {
                    return (
                        <View style={{ backgroundColor: 'red' }}>
                            <Text>{'heisdklf kldsjfklsd jlfk s'}</Text>
                        </View>
                    )
                }
            },
            {
                title: strings('notifications.tabAll'),
                subTitle: timePrep,
                balance: '0.00',
                ExtraViewData: () => {
                    return (
                        <View style={{ backgroundColor: 'red' }}>
                            <Text>{'heisdklf kldsjfklsd jlfk s'}</Text>
                        </View>
                    )
                }
            }
        ]

        this.setState(() => ({
            flatlistData
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
            refreshing: true,
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
            active: tab.index === newTab.index,
        }))
        this.setState(() => ({ tabs: newTabs }))
    }

    renderFlatlistItem = ({ item }) => {
        console.log(item)
        return (
            <CashbackData
                data={item}
            />
        )
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
                title={strings('cashback.pageTitle')}
                ExtraView={this.renderTabs}
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
                    {this.state.tabs[0].active && (
                        <>
                            <ImageBackground
                                style={styles.qrBg}
                                source={require('@assets/images/qrBG.png')}
                            >
                                <Text style={[styles.pageSubtitle, { color: colors.common.text1, marginHorizontal: GRID_SIZE / 2 }]}>{strings('cashback.pageSubtitle')}</Text>
                                <Text style={styles.pageSubtitleText}>{strings('cashback.pageSubtitleText')}</Text>
                                <Image style={styles.picProcent} source={require('@assets/images/picProcent.png')}/>
                                <TouchableOpacity
                                    style={[styles.qrCodeContainer, {marginVertical: GRID_SIZE}]}
                                    onPress={() => this.copyToClip(cashbackLink)}
                                    activeOpacity={0.8}
                                >
                                    <QrCodeBox
                                        value={cashbackLink}
                                        size={110}
                                        color={colors.cashback.qrCode}
                                        backgroundColor={colors.cashback.background}
                                        onError={this.handleRenderQrError}
                                        style={styles.qrCode}
                                    />
                                    <Text style={[styles.qrCodeTokenString, {
                                        color: colors.cashback.token,
                                        marginTop: GRID_SIZE * 0.75
                                    }]}>{cashbackLinkTitle} <CustomIcon name="copy" size={18}
                                                                        color={colors.cashback.token}/></Text>
                                </TouchableOpacity>
                            </ImageBackground>
                        </>
                    )}
                    {this.state.tabs[1].active && (
                        <>
                            <FlatList
                                data={this.state.flatlistData}
                                keyExtractor={({ index }) => index}
                                horizontal={true}
                                renderItem={this.renderFlatlistItem}
                                showsHorizontalScrollIndicator={false}
                            />
                            {this.renderContent()}
                        </>
                    )}

                    {this.state.tabs[2].active && (
                        <HowItWorks />
                    )}

                </ScrollView>
            </ScreenWrapper >
        )
    }

    renderContent = () => {
        const { selectedContent } = this.state

        const { cashbackStore } = this.props

        const cashbackLinkTitle = cashbackStore.dataFromApi.customToken || false
        const cashbackToken = cashbackStore.dataFromApi.cashbackToken || cashbackStore.cashbackToken

        const overalVolume = cashbackStore.dataFromApi.overalVolume || 0
        let overalPrep = 1 * BlocksoftPrettyNumbers.makeCut(overalVolume, 6).justCutted

        let cashbackBalance = cashbackStore.dataFromApi.cashbackBalance || 0
        let totalCashbackBalance = cashbackStore.dataFromApi.totalCashbackBalance || 0

        let cpaBalance = cashbackStore.dataFromApi.cpaBalance || 0
        let cpaTotalBalance = cashbackStore.dataFromApi.cpaTotalBalance || 0
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
            cpaTotalBalance = '?'
            cpaBalance = '?'
            cpaLevel1 = '?'
            cpaLevel2 = '?'
            cpaLevel3 = '?'
        }

        MarketingEvent.logEvent('taki_cashback_2_render', {
            cashbackLink: cashbackStore.dataFromApi.cashbackLink || cashbackStore.cashbackLink || '',
            invitedUsers,
            level2Users,
            cashbackBalance,
            totalCashbackBalance,
            overalPrep,
            cashbackParentToken,
            cpaBalance,
            cpaTotalBalance,
            cpaLevel1,
            cpaLevel2,
            cpaLevel3
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
                cpaBalance={cpaBalance}
                cpaTotalBalance={cpaTotalBalance}
                cpaLevel1={cpaLevel1}
                cpaLevel2={cpaLevel2}
                cpaLevel3={cpaLevel3}
                inviteLink={this.state.inviteLink}
                updatedTime={timePrep}
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
        flexGrow: 1,
    },
    pageSubtitle: {
        flex: 1,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 22,
        lineHeight: 27,
        width: 200,
        height: 100,
        position: 'absolute',
        top: -120
    },
    pageSubtitleText: {
        position: 'absolute',
        zIndex: 2,
        top: -115,
        left: 230,
        width: 85,
        fontSize: 40,
        textAlign: 'center',
        fontFamily: 'Montserrat-SemiBold',
        fontStyle: 'normal'
    },
    qrCodeContainer: {
        flex: 1,
        alignItems: 'center',
        left: '30.5%',
        position: 'absolute',
        top: 20
    },
    qrCode: {
        alignSelf: 'center',
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
    },
    qrBg: {
        flex: 1,
        justifyContent: 'center',
        alignSelf: 'center',
        width: 375,
        height: 375,
        position: 'relative',
        marginTop: 150
    },
    picProcent: {
        position: 'absolute',
        top: -165,
        left: 185,
        width: 220,
        height: 220,
        resizeMode: 'contain'
    }
})
