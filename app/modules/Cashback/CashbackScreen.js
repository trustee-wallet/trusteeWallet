/**
 * @version 0.77
 * @author Vadym
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    ScrollView,
    StyleSheet,
    RefreshControl,
    Dimensions,
    View
} from 'react-native'

import { FlatList } from 'react-native-gesture-handler'
import { TabView } from 'react-native-tab-view'

import { strings } from '@app/services/i18n'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import UpdateCashBackDataDaemon from '@app/daemons/back/UpdateCashBackDataDaemon'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import NavStore from '@app/components/navigation/NavStore'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import Tabs from '@app/components/elements/new/cashbackTabs'
import CashbackData from './elements/CashbackData'

import UtilsService from '@app/services/UI/PrettyNumber/UtilsService'
import QrCodePage from '@app/modules/Cashback/elements/QrCodePage'
import { Tab2, Tab3 } from '@app/modules/Cashback/elements/ExtraViewDataContent'
import DetailsHeader from '@app/modules/Cashback/elements/DetailsHeader'

import InfoNotification from '@app/components/elements/new/InfoNotification'

class CashbackScreen extends React.PureComponent {

    state = {
        selectedContent: null,
        promoCode: '',
        inviteLink: '',
        inviteLinkError: false,
        refreshing: false,
        clickRefresh: false,
        isLoading: false,
        index: 0,
        routes: [
            {
                title: strings('notifications.cashbackTabInvite'),
                key: 'first'
            },
            {
                title: strings('notifications.tabInfo'),
                key: 'second'
            }
        ],
        selected: false,
        focus: false
    }

    cashbackCurrency = 'USDT'
    cpaValue = 10
    cashbackValue = 2

    _focusScreen = (e) => {
        this.setState({ focus: true })
    }

    _blurScreen = (e) => {
        this.setState({ focus: false })
    }

    componentDidMount() {
        this.navigationFocusListener = this.props.navigation.addListener('focus', this._focusScreen)
        this.navigationBlurListener = this.props.navigation.addListener('blur', this._blurScreen)
    }

    componentWillUnmount() {
        this.navigationFocusListener()
        this.navigationBlurListener()
    }

    renderDetailsHeader = () => {

        const {
            cashbackStore
        } = this.props

        const cashbackBalance = cashbackStore.dataFromApi.cashbackBalance || 0
        const cpaBalance = cashbackStore.dataFromApi.cpaBalance || 0

        const getSections = [
            {
                title: strings('cashback.cashback'),
                value: 'CASHBACK',
                balance: `${UtilsService.cutNumber(cashbackBalance, 2)} ${this.cashbackCurrency}`,
                iconType: 'earn'
            },
            {
                title: strings('cashback.cpa'),
                value: 'CPA',
                balance: `${UtilsService.cutNumber(cpaBalance, 2)} ${this.cashbackCurrency}`,
                iconType: 'cpa'
            }
        ]

        return (
            <DetailsHeader
                cashbackStore={cashbackStore}
                scrollDetails={this.scrollDetails}
                sections={getSections}
            />
        )
    }

    renderExtraView = () => {

        const { cashbackStore } = this.props

        const { GRID_SIZE } = this.context

        const time = cashbackStore.dataFromApi.time || false
        let timePrep
        if (time) {
            const timeDate = new Date(time)
            timePrep = timeDate.toLocaleTimeString()
        } else {
            timePrep = '-'
        }

        const cashbackBalance = cashbackStore.dataFromApi.cashbackBalance || 0
        const cpaBalance = cashbackStore.dataFromApi.cpaBalance || 0

        const cashbackTotalBalance = cashbackStore.dataFromApi.totalCashbackBalance || 0
        const cpaTotalBalance = cashbackStore.dataFromApi.cpaTotalBalance || 0

        const windowWidth = Dimensions.get('window')

        const cashbackCondition = cashbackBalance >= this.cashbackValue

        const cpaCondition = cpaBalance >= this.cpaValue

        const totalCashbackPercent = UtilsService.cutNumber(cashbackTotalBalance / (cashbackTotalBalance + cpaTotalBalance) * 100, 2) || 0
        const totalCpaPercent = UtilsService.cutNumber(cpaTotalBalance / (cashbackTotalBalance + cpaTotalBalance) * 100, 2) || 0

        const cashbackPercent = UtilsService.cutNumber(cashbackBalance / this.cashbackValue * 100, 2) || 0
        const cpaPercent = UtilsService.cutNumber(cpaBalance / this.cpaValue * 100, 2) || 0

        const flatListData = [

            {
                title: strings('cashback.availableCashBack'),
                subTitle: strings('cashback.updated') + ' ' + timePrep,
                balance: UtilsService.cutNumber(cashbackBalance + cpaBalance, 2),
                textInput: true,
            },
            {
                title: strings('cashback.cashback'),
                subTitle: strings('cashback.balanceTitle'),
                balance: UtilsService.cutNumber(cashbackBalance, 2),
                ExtraViewData: () => {
                    return (
                        <Tab2
                            procent={cashbackPercent}
                            cashbackStore={cashbackStore}
                            progress={cashbackBalance / this.cashbackValue}
                            windowWidth={windowWidth}
                            condition={cashbackCondition}
                            balance={UtilsService.cutNumber(cashbackBalance, 2)}
                            minimalWithdraw={this.cashbackValue}
                            currency={this.cashbackCurrency}
                        />
                    )
                }
            },
            {
                title: strings('cashback.cpa'),
                subTitle: strings('cashback.balanceTitle'),
                balance: UtilsService.cutNumber(cpaBalance, 2),
                ExtraViewData: () => {
                    return (
                        <Tab2
                            procent={cpaPercent}
                            progress={cpaBalance / this.cpaValue}
                            windowWidth={windowWidth}
                            condition={cpaCondition}
                            balance={UtilsService.cutNumber(cpaBalance, 2)}
                            minimalWithdraw={this.cpaValue}
                            currency={this.cashbackCurrency}
                        />
                    )
                }
            },
            {
                title: strings('cashback.wholeBalance'),
                subTitle: strings('cashback.updated') + ' ' + timePrep,
                balance: UtilsService.cutNumber(cashbackTotalBalance + cpaTotalBalance, 2),
                ExtraViewData: () => {
                    return (
                        <Tab3
                            cashbackPercent={totalCashbackPercent}
                            cpaPercent={totalCpaPercent}
                        />
                    )
                }
            }
        ]

        return (
            <FlatList
                data={flatListData}
                contentContainerStyle={{ paddingHorizontal: GRID_SIZE }}
                style={{ marginHorizontal: -GRID_SIZE }}
                keyExtractor={({ index }) => index}
                horizontal={true}
                renderItem={this.renderFlatListItem}
                showsHorizontalScrollIndicator={false}
            />
        )
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const qrCodeData = NavStore.getParamWrapper(this, 'qrData')
        if (qrCodeData && typeof qrCodeData.qrCashbackLink !== 'undefined' && qrCodeData.qrCashbackLink) {
            if (prevState.inviteLink !== qrCodeData.qrCashbackLink) {
                this.setState(() => ({ inviteLink: qrCodeData.qrCashbackLink }))
            }
        }
    }

    scrollTabSwitch = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 0 })
            } catch (e) {
            }
        }, 0)
    }

    scrollDetails = (activeSection) => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: activeSection.length !== 0 ? 200 : 0 })
            } catch (e) {
            }
        }, 300)
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

    handleRefresh = async (click = false) => {
        this.setState({
            refreshing: !click,
            clickRefresh: click
        })

        await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })

        this.setState({
            refreshing: false,
            clickRefresh: false
        })
    }

    renderTabs = () => <Tabs active={this.state.index} tabs={this.state.routes} changeTab={this.handleTabChange} />

    handleTabChange = (index) => {
        this.scrollTabSwitch()
        this.setState({ index: index })
    }

    renderFlatListItem = ({ item, index }) => {
        return (
            <CashbackData
                data={item}
                refresh={index === 0}
                clickRefresh={this.state.clickRefresh}
                handleRefresh={() => this.handleRefresh(true)}
            />
        )
    }

    renderFirstRoute = () => {

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
            <View style={{ marginHorizontal: 16 }}>
                <QrCodePage
                    cashbackLink={cashbackLink}
                    cashbackLinkTitle={cashbackLinkTitle}
                    scrollToTop={this.scrollTabSwitch}
                    isFocused={this.state.focus}
                />
            </View>
        )
    }

    renderSecondRoute = () => {

        const {
            GRID_SIZE
        } = this.context

        return (
            <ScrollView style={{ marginTop: GRID_SIZE }}>
                {this.renderExtraView()}
                <View style={{marginTop: GRID_SIZE, marginHorizontal: GRID_SIZE}}>
                    <InfoNotification
                        animated={false}
                        range={true}
                        withoutClosing={true}
                        subTitle={strings('cashback.cashbackMessage')}
                        customTextStyles={{ paddingLeft: 0, marginTop: -GRID_SIZE / 4 }}
                    />
                </View>
                <View style={{ marginTop: GRID_SIZE * 1.5}}>
                    {this.renderDetailsHeader()}
                </View>
            </ScrollView>
        )
    }


    renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return this.renderFirstRoute()
            case 'second':
                return this.renderSecondRoute()
            default:
                return null
        }
    }

    render() {

        MarketingAnalytics.setCurrentScreen('CashBackScreen')

        const {
            colors
        } = this.context

        const {
            cashbackStore
        } = this.props

        let cashbackLink = cashbackStore.dataFromApi.cashbackLink || false
        if (!cashbackLink || cashbackLink === '') {
            cashbackLink = cashbackStore.cashbackLink || ''
        }

        return (
            <ScreenWrapper
                title={strings('cashback.pageTitle')}
                ExtraView={this.renderTabs}
                rightAction={() => this.handlePressShare(cashbackLink)}
                rightType='share'
            >
                <ScrollView
                    ref={ref => this.scrollView = ref}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                    scrollEnabled={this.state.index === 1}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.refreshControlIndicator}
                            colors={[colors.common.refreshControlIndicator]}
                            progressBackgroundColor={colors.common.refreshControlBg}
                            progressViewOffset={-20}
                        />
                    }>
                    <TabView
                        style={styles.container}
                        navigationState={this.state}
                        renderScene={this.renderScene}
                        renderHeader={null}
                        onIndexChange={this.handleTabChange}
                        renderTabBar={() => null}
                        useNativeDriver
                    />
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        cashbackStore: getCashBackData(state)
    }
}

CashbackScreen.contextType = ThemeContext

export default connect(mapStateToProps)(CashbackScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    scrollViewContent: {
        flexGrow: 1
    }
})
