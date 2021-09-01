/**
 * @version 0.50
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

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { strings } from '@app/services/i18n'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { ThemeContext } from '@app/theme/ThemeProvider'
import DetailsContent from './elements/Details'
import HowItWorks from './elements/HowItWorks'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import UpdateCashBackDataDaemon from '@app/daemons/back/UpdateCashBackDataDaemon'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import NavStore from '@app/components/navigation/NavStore'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import Tabs from '@app/components/elements/new/newTabs'
import CashbackData from './elements/CashbackData'

import UtilsService from '@app/services/UI/PrettyNumber/UtilsService'
import QrCodePage from '@app/modules/Cashback/elements/QrCodePage'
import { Tab1, Tab2, Tab3 } from '@app/modules/Cashback/elements/ExtraViewDataContent'
import DetailsHeader from '@app/modules/Cashback/elements/DetailsHeader'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class CashbackScreen extends React.PureComponent {

    state = {
        selectedContent: null,
        promoCode: '',
        inviteLink: '',
        inviteLinkError: false,
        refreshing: false,
        selectedTitle: null,
        isLoading: false,
        index: 0,
        routes: [
            {
                title: strings('notifications.tabInvite'),
                key: 'first'
            },
            {
                title: strings('notifications.tabInfo'),
                key: 'second'
            },
            {
                title: strings('notifications.tabFaq'),
                key: 'third'
            }
        ],
        tab1Height: SCREEN_WIDTH * 1.3,
        tab2Height: SCREEN_WIDTH * 1.4999,
        tab3Height: 'auto'

    }

    cashbackCurrency = 'USDT'

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

        const cashbackToken = cashbackStore.dataFromApi.cashbackToken || cashbackStore.cashbackToken
        const cashbackLinkTitle = cashbackStore.dataFromApi.customToken || false

        let cashbackParentToken = cashbackStore.dataFromApi.parentToken || false
        if (!cashbackParentToken) {
            cashbackParentToken = cashbackStore.parentToken || ''
        }
        if (cashbackParentToken === cashbackToken || cashbackParentToken === cashbackLinkTitle) {
            cashbackParentToken = ''
        }

        const windowWidth = Dimensions.get('window')

        const cashbackCondition = cashbackBalance >= 2

        const cpaCondition = cpaBalance >= 100

        const cashbackProcent = UtilsService.cutNumber(cashbackBalance / 2 * 100, 2)

        const cpaProcent = UtilsService.cutNumber(UtilsService.getPercent(cpaBalance, 100), 2)

        const flatListData = [

            {
                title: strings('cashback.availableCashBack'),
                subTitle: strings('cashback.updated') + ' ' + timePrep,
                balance: UtilsService.cutNumber(cashbackBalance + cpaBalance, 2),
                ExtraViewData: () => {
                    return (
                        <Tab1
                            cashbackStore={cashbackStore}
                            cashbackTocen={cashbackToken}
                            windowWidth={windowWidth}
                            cashbackParentToken={cashbackParentToken}
                        />
                    )
                }
            },
            {
                title: strings('cashback.balanceTitle'),
                subTitle: strings('cashback.cashback'),
                balance: UtilsService.cutNumber(cashbackBalance, 2),
                ExtraViewData: () => {
                    return (
                        <Tab2
                            cashbackStore={cashbackStore}
                            progress={cashbackBalance / 2}
                            windowWidth={windowWidth}
                            condition={cashbackCondition}
                            balance={UtilsService.cutNumber(cashbackBalance, 2)}
                            minimalWithdraw={2}
                            currency={this.cashbackCurrency}
                        />
                    )
                }
            },
            {
                title: strings('cashback.balanceTitle'),
                subTitle: strings('cashback.cpa'),
                balance: UtilsService.cutNumber(cpaBalance, 2),

                ExtraViewData: () => {
                    return (
                        <Tab2
                            progress={cpaBalance / 100}
                            windowWidth={windowWidth}
                            condition={cpaCondition}
                            balance={UtilsService.cutNumber(cpaBalance, 2)}
                            minimalWithdraw={100}
                            currency={this.cashbackCurrency}
                        />
                    )
                }
            },
            {
                title: strings('cashback.wholeBalance'),
                subTitle: strings('cashback.updated') + ' ' + timePrep,
                balance: UtilsService.cutNumber(cashbackBalance + cpaBalance, 2),
                ExtraViewData: () => {
                    return (
                        <Tab3
                            cashbackBalance={cashbackBalance}
                            cashbackProcent={cashbackProcent}
                            cpaBalance={cpaBalance}
                            cpaProcent={cpaProcent}
                        />
                    )
                }
            }
        ]

        return (
            <FlatList
                data={flatListData}
                contentContainerStyle={{ paddingHorizontal: GRID_SIZE / 2 }}
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

    scrollDetails = (value) => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: this.state.selectedTitle === value ? 100 : -200 })
            } catch (e) {
            }
        }, 300)
    }

    scrollTabSwitch = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 0 })
            } catch (e) {
            }
        }, 0)
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

    handleRefresh = async () => {
        this.setState({
            refreshing: true
        })

        await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })

        this.setState({
            refreshing: false
        })
    }

    renderTabs = () => <Tabs active={this.state.index} tabs={this.state.routes} changeTab={this.handleTabChange} />

    handleTabChange = (index) => {
        this.scrollTabSwitch()
        this.setState({ index })
    }

    renderFlatListItem = ({ item }) => {
        return (
            <CashbackData
                data={item}
            />
        )
    }

    handleSelectTitle = (value) => {
        this.scrollDetails(value)
        this.setState({ selectedTitle: this.state.selectedTitle === value ? null : value })
    }


    renderFirstRoute = () => {

        const {
            cashbackStore
        } = this.props
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
                />
            </View>
        )
    }

    renderSecondRoute = () => {

        const {
            selectedTitle
        } = this.state

        const {
            GRID_SIZE
        } = this.context

        const { cashbackStore } = this.props

        const cashbackBalance = cashbackStore.dataFromApi.cashbackBalance || 0
        const cpaBalance = cashbackStore.dataFromApi.cpaBalance || 0

        return (
            <View style={{ marginHorizontal: GRID_SIZE }}>
                {this.renderExtraView()}
                <DetailsHeader
                    title={strings('cashback.cashback')}
                    onPress={() => {
                        this.handleSelectTitle('CASHBACK')
                    }}
                    balance={UtilsService.cutNumber(cashbackBalance, 2)}
                    currency={this.cashbackCurrency}
                    progress={cashbackBalance / 2}
                    icon={selectedTitle === 'CASHBACK' ? 'close' : 'coinSettings'}
                />
                <DetailsHeader
                    title={strings('cashback.cpa')}
                    onPress={() => {
                        this.handleSelectTitle('CPA')
                    }}
                    balance={UtilsService.cutNumber(cpaBalance, 2)}
                    currency={this.cashbackCurrency}
                    progress={cpaBalance / 100}
                    icon={selectedTitle === 'CPA' ? 'close' : 'coinSettings'}
                />
                {this.renderContent()}
            </View>

        )
    }

    renderThirdRoute = () => {
        return (
            <View style={{ marginHorizontal: 16 }}>
                <HowItWorks />
            </View>
        )
    }

    renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return this.renderFirstRoute()
            case 'second':
                return this.renderSecondRoute()
            case 'third':
                return this.renderThirdRoute()
            default:
                return null
        }
    }

    handleSelectHeight = (index) => {
        switch (index) {
            case 0 : {
                return this.state.tab1Height
            }
            case 1 : {
                return this.state.tab2Height
            }
            case 2 : {
                return this.state.tab3Height
            }
            default:
                return null

        }
    }

    render() {

        MarketingAnalytics.setCurrentScreen('CashBackScreen')

        const {
            colors,
            GRID_SIZE
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
                    ref={(ref) => {
                        this.scrollView = ref
                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { paddingVertical: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE }]}
                    keyboardShouldPersistTaps='handled'
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
                        style={[styles.container, { marginHorizontal: -GRID_SIZE, height: this.handleSelectHeight(this.state.index) }]}
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

    renderContent = () => {

        const { cashbackStore } = this.props

        const { selectedTitle } = this.state

        const overalVolume = cashbackStore.dataFromApi.overalVolume || 0
        let overalPrep = 1 * BlocksoftPrettyNumbers.makeCut(overalVolume, 6).justCutted

        let cpaLevel1 = cashbackStore.dataFromApi.cpaLevel1 || 0
        let cpaLevel2 = cashbackStore.dataFromApi.cpaLevel2 || 0
        let cpaLevel3 = cashbackStore.dataFromApi.cpaLevel3 || 0

        let invitedUsers = cashbackStore.dataFromApi.invitedUsers || 0
        let level2Users = cashbackStore.dataFromApi.level2Users || 0

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
            />
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
