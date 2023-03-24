/**
 * @version 0.30
 */
import React from 'react'
import {
    SafeAreaView,
    View,
    RefreshControl,
    StyleSheet,
    FlatList,
    SectionList,
    Text
} from 'react-native'
import { connect } from 'react-redux'

import { useScrollToTop } from '@react-navigation/native'

import _isEqual from 'lodash/isEqual'

import CryptoCurrency from './elements/CryptoCurrency'
import WalletInfo from './elements/WalletInfo'
import Header from './elements/Header'
import SortList from './elements/SortList'

import Log from '@app/services/Log/Log'

import UpdateCurrencyRateDaemon from '@app/daemons/back/UpdateCurrencyRateDaemon'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'

import { ThemeContext } from '@app/theme/ThemeProvider'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { SendDeepLinking } from '@app/appstores/Stores/Send/SendDeepLinking'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import { getHomeFilterWithBalance, getIsBlurVisible, getSelectedWalletData, getSortValue } from '@app/appstores/Stores/Main/selectors'
import { getWalletsGeneralData } from '@app/appstores/Stores/Wallet/selectors'

import { NftActions } from '@app/appstores/Stores/Nfts/NftsActions'
import { getNftsData } from '@app/appstores/Stores/Nfts/selectors'
import { handleReceive, handleSend, handleHide, handleLateRefresh, getBalanceData, getSortedData, getDerivedState, getSectionsData } from './helpers'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import { getAccountList } from '@app/appstores/Stores/Account/selectors'
import { strings } from '@app/services/i18n'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'

import SheetBottom from '@app/components/elements/SheetBottom/SheetBottom'
import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'


class HomeScreen extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            isBalanceVisible: true,
            originalVisibility: false,
            isCurrentlyDraggable: false,
            hasStickyHeader: false,
            enableVerticalScroll: true,
            constructorMode: false,
            originalData: [],
            data: [],
            currenciesOrder: [],
            sortValue: this.props.sortValue || trusteeAsyncStorage.getSortValue() || null,
            homeFilterWithBalance: this.props.homeFilterWithBalance || trusteeAsyncStorage.getHomeFilterWithBalance() || false
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        return getDerivedState(nextProps, prevState)
    }

    async componentDidMount() {
        Log.log('HomeScreen componentDidMount sortValue ' + JSON.stringify(this.props.sortValue))
        try {
            Log.log('WalletList.HomeScreen initDeepLinking')
            SendDeepLinking.initDeepLinking()
        } catch (e) {
            Log.log('WalletList.HomeScreen initDeepLinking error ' + e.message)
        }

        try {
            Log.log('WalletList.HomeScreen initWalletConnect')
            await walletConnectActions.initWalletConnect()
        } catch (e) {
            Log.log('WalletList.HomeScreen initWalletConnect error ' + e.message)
        }

        try {
            Log.log('WalletList.HomeScreen initial sortValue ' + this.state?.sortValue)

            setLoaderStatus(false)
            this.getBalanceVisibility()
            NftActions.init(false)
        } catch (e) {
            Log.log('WalletList.HomeScreen componentDidMount error ' + e.message)
        }
    }

    componentDidUpdate(prevProps) {
        try {
            if (!_isEqual(prevProps.sortValue, this.props.sortValue) || !_isEqual(prevProps.accountList, this.props.accountList) || !_isEqual(prevProps.homeFilterWithBalance, this.props.homeFilterWithBalance)) {

                if (!_isEqual(prevProps.sortValue, this.props.sortValue)) {
                    Log.log('HomeScreen componentDidUpdate sortValue ' + JSON.stringify(this.props.sortValue))
                    if (this.props.sortValue === 'coinFirst' || this.props.sortValue === 'tokenFirst') {
                        Log.log('HomeScreen.getSectionData data ' + JSON.stringify(getSectionsData(this.state.data).map(item => item.data.map(asset => asset.currencyCode))))
                    } else {
                        Log.log('HomeScreen.getSortedData result ' + JSON.stringify(this.state.data.map(item => item.currencyCode)))
                    }
                }
                this.setState({
                    data: getSortedData(this.state.originalData, this.state.data, this.props.accountList, this.props.sortValue, this.props.homeFilterWithBalance),
                    sortValue: this.props.sortValue,
                    homeFilterWithBalance: this.props.homeFilterWithBalance
                })
            }
        } catch (e) {
            Log.log('WalletList.HomeScreen componentDidUpdate error ' + e.message)
        }
    }

    getBalanceVisibility = () => {
        try {
            const isBalanceVisible = this.props.isBalanceVisible
            this.setState(() => ({ isBalanceVisible, originalVisibility: isBalanceVisible }))
        } catch (e) {
            Log.log('WalletList.HomeScreen getBalanceVisibility error ' + e.message)
        }
    }

    handleRefresh = async () => {
        try {
            this.setState({ refreshing: true })

            try {
                await UpdateCurrencyRateDaemon.updateCurrencyRate({ force: true, source: 'HomeScreen.handleRefresh' })
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateCurrencyRateDaemon ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.forceDaemonUpdate()
            } catch (e) {
                Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAccountListDaemon ' + e.message)
            }

            try {
                await NftActions.getDataByAddress(this.props.nftsData.address, true)
            } catch (e) {
                Log.err('WalletList.HomeScreen handleRefresh error NftActions ' + e.message)
            }

            this.setState({ refreshing: false })
        } catch (e) {
            Log.err('WalletList.HomeScreen handleRefresh error ' + e.message)
        }

        handleLateRefresh()
    }

    changeBalanceVisibility = async () => {
        try {
            const newVisibilityValue = !this.state.isBalanceVisible
            settingsActions.setSettings('isBalanceVisible', newVisibilityValue ? '1' : '0')
            this.setState(() => ({ isBalanceVisible: newVisibilityValue, originalVisibility: newVisibilityValue }))
        } catch (e) {
            Log.log('WalletList.HomeScreen changeBalanceVisibility error ' + e.message)
        }
    }

    triggerBalanceVisibility = (value) => {
        try {
            this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
        } catch (e) {
            Log.log('WalletList.HomeScreen triggerBalanceVisibility error ' + e.message)
        }
    }

    updateOffset = (offset) => {
        try {
            // const newOffset = Math.round(offset)
            const newOffset = Math.round(offset.nativeEvent.contentOffset.y)
            if (!this.state.hasStickyHeader && newOffset > 110) this.setState(() => ({ hasStickyHeader: true }))
            if (this.state.hasStickyHeader && newOffset < 110) this.setState(() => ({ hasStickyHeader: false }))
        } catch (e) {
            Log.log('WalletList.HomeScreen updateOffset error ' + e.message)
        }
    }

    setScrollEnabled = (value) => {
        try {
            if (this.props.scrollRef && this.props.scrollRef.setNativeProps) {
                this.props.scrollRef.setNativeProps({ scrollEnabled: value });
            } else if (this.props.scrollRef && this.props.scrollRef.getScrollResponder) {
                const scrollResponder = this.props.scrollRef.getScrollResponder();
                if (scrollResponder.setNativeProps) scrollResponder.setNativeProps({ scrollEnabled: value });
            } else {
                this.setState(() => ({ enableVerticalScroll: value }))
            }
        } catch (e) {
            Log.log('WalletList.HomeScreen setScrollEnabled error ' + e.message)
        }
    };

    get commonHeaderProps() {
        const { colors } = this.context

        const balanceData = getBalanceData(this.props)

        const { walletIsCreatedHere } = this.props.selectedWalletData

        return {
            ref: this.props.scrollRef,
            showsVerticalScrollIndicator: false,
            contentContainerStyle: styles.list,
            onScroll: this.updateOffset,
            scrollEnabled: this.state.enableVerticalScroll,
            refreshControl:
                <RefreshControl
                    enabled={!this.state.constructorMode}
                    refreshing={this.state.refreshing}
                    onRefresh={this.handleRefresh}
                    tintColor={colors.common.refreshControlIndicator}
                    colors={[colors.common.refreshControlIndicator]}
                    progressBackgroundColor={colors.common.refreshControlBg}
                    progressViewOffset={-20}
                />,
            ListHeaderComponent: (
                <WalletInfo
                    isBalanceVisible={this.state.isBalanceVisible}
                    originalVisibility={this.state.originalVisibility}
                    changeBalanceVisibility={this.changeBalanceVisibility}
                    triggerBalanceVisibility={this.triggerBalanceVisibility}
                    balanceData={balanceData}
                    selectedWalletData={this.props.selectedWalletData}
                />
            ),
            renderItem: ({ item }) => (
                <CryptoCurrency
                    cryptoCurrency={item}
                    walletIsCreatedHere={walletIsCreatedHere}
                    isBalanceVisible={this.state.isBalanceVisible}
                    handleReceive={account => handleReceive(item, account)}
                    handleSend={account => handleSend(item, account)}
                    handleHide={() => handleHide(item)}
                    setScrollEnabled={this.setScrollEnabled}
                />
            ),
            keyExtractor: item => item.currencyCode
        }

    }

    handlerSortValue = () => {
        this.bottomSheetRef?.open()
    }

    handleCloseSortValue = () => {
        this.bottomSheetRef?.close()
    }

    render() {

        const { colors, GRID_SIZE } = this.context

        const { sortValue, homeFilterWithBalance } = this.state

        MarketingAnalytics.setCurrentScreen('WalletList.HomeScreen')

        const balanceData = getBalanceData(this.props)

        return (
            <>
                <View style={styles.container}>
                    <Header
                        hasStickyHeader={this.state.hasStickyHeader}
                        isBalanceVisible={this.state.isBalanceVisible}
                        originalVisibility={this.state.originalVisibility}
                        triggerBalanceVisibility={this.triggerBalanceVisibility}
                        balanceData={balanceData}
                        handleSortView={this.handlerSortValue}
                        sortValue={sortValue}
                    />
                    <SafeAreaView style={[styles.safeAreaContent, { backgroundColor: colors.homeScreen.tabBarBackground }]} />
                    <View style={[styles.content, { backgroundColor: colors.common.background }]}>
                        <View style={styles.stub} />
                        {(sortValue === 'coinFirst' || sortValue === 'tokenFirst') ?
                            <SectionList
                                {...this.commonHeaderProps}
                                sections={getSectionsData(this.state.data)}
                                renderSectionHeader={({ section: { title } }) => {
                                    if (title === 'special') return null

                                    return (
                                        <Text style={[styles.blockTitle, { color: colors.common.text3, paddingLeft: GRID_SIZE * 1.25, paddingTop: GRID_SIZE }]}>
                                            {strings(`homeScreen.categories.${title}`)}
                                        </Text>
                                    )
                                }}
                                renderSectionFooter={() => <View style={{ flex: 1, height: GRID_SIZE }} />}
                                stickySectionHeadersEnabled={false}
                            />
                            :
                            <FlatList
                                {...this.commonHeaderProps}
                                data={this.state.data}
                            />
                        }
                    </View>
                </View>
                <SheetBottom
                    ref={ref => this.bottomSheetRef = ref}
                    snapPoints={[0, 440]}
                    index={0}
                >
                    <SortList
                        handleClose={this.handleCloseSortValue}
                        sortValue={sortValue}
                        homeFilterWithBalance={homeFilterWithBalance}
                    />
                </SheetBottom>
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWalletData: getSelectedWalletData(state),
        walletsGeneralData: getWalletsGeneralData(state),
        isBlurVisible: getIsBlurVisible(state),
        currencies: getVisibleCurrencies(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        nftsData: getNftsData(state),
        sortValue: getSortValue(state),
        cashbackStore: getCashBackData(state),
        accountList: getAccountList(state),
        homeFilterWithBalance: getHomeFilterWithBalance(state)
    }
}

HomeScreen.contextType = ThemeContext

function HomeWrap(props) {
    const ref = React.useRef(null);

    useScrollToTop(ref);

    return <HomeScreen {...props} scrollRef={ref} />
}

export default connect(mapStateToProps)(HomeWrap)


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeAreaContent: {
        flex: 0,
    },
    content: {
        flex: 1,
    },
    stub: {
        marginBottom: 50
    },
    list: {
        paddingBottom: 20,
        paddingTop: 10
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    }
})
