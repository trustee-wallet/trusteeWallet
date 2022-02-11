/**
 * @version 0.43
 * @author Vadym
 */

import React, { PureComponent } from 'react'
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Platform,
    RefreshControl,
    ActivityIndicator
} from 'react-native'
import { connect } from 'react-redux'
import { FlatList } from 'react-native-gesture-handler'
import { TabView } from 'react-native-tab-view'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import Tabs from '@app/components/elements/new/TabsWithUnderline'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import Loader from '@app/components/elements/LoaderItem'

import { ThemeContext } from '@app/theme/ThemeProvider'

import AccountHd from '@app/appstores/DataSource/Account/AccountHd'
import { getSelectedAccountData, getSelectedWalletData, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import { getIsBalanceVisible, getIsSegwit } from '@app/appstores/Stores/Settings/selectors'

import { strings } from '@app/services/i18n'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { changeAddress } from './helpers'
import AccountGradientBlock from '@app/components/elements/new/AccountGradientBlock'
import HdAddressListItem from './elements/HdAddressListItem'

const TX_PER_PAGE = 40

class AllAddressesScreen extends PureComponent {

    state = {
        settingAddressType: false,
        settingAddressTypeTriggered: false,
        isBalanceVisibleTriggered: false,
        isBalanceVisible: true,
        routes: [
            {
                title: 'SEGWIT',
                key: 'first'
            },
            {
                title: 'LEGACY',
                key: 'second'
            }
        ],
        index: 0,
        addresses: [],
        loading: false,
        generating: false
    }

    async componentDidMount() {
        await this.loadAddresses(0)
    }

    handleClose = () => {
        NavStore.reset('TabBar')
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleChangeAddress = async () => {
        this.setState({ generating: true })
        await changeAddress.call(this)
        this.setState({ generating: false })
    }

    componentDidUpdate() {
        if (this.state.generating) {
            this.loadAddresses(0)
        }
    }

    filterAddresses = (value, param) => {
        return value.filter(as => (
            as.address[0] === param
        ))
    }

    loadAddresses = async (from = 6, perPage = TX_PER_PAGE) => {

        const { currencyCode, walletHash } = this.props.selectedAccountData

        const params = {
            walletHash: walletHash,
            currencyCode: currencyCode,
            withBalances: true,
            reverse: true,
            limitFrom: from,
            limitPerPage: perPage
        }

        const tmp = await AccountHd.getAddresses(params)

        const value = Object.values(tmp)

        if (!value || value.length === 0) return

        if (from === 0) {  // reloading when from = 0
            this.setState({
                addresses: value
            })
        } else {
            this.setState((state) => ({
                addresses: state.addresses.concat(value)
            }))
        }

    }

    triggerBalanceVisibility = (value, originalVisibility) => {
        this.setState((state) => ({ isBalanceVisible: value || originalVisibility, isBalanceVisibleTriggered: true }))
    }

    renderHeader = () => {

        const { originalVisibility } = this.props
        const { isBalanceVisible, isBalanceVisibleTriggered } = this.state
        const finalIsBalanceVisible = isBalanceVisibleTriggered ? isBalanceVisible : originalVisibility

        const { isSynchronized, balancePretty, basicCurrencySymbol, basicCurrencyBalance, currencyCode } = this.props.selectedAccountData

        const { colors } = this.context

        let tmp = BlocksoftPrettyNumbers.makeCut(balancePretty, 7, 'AccountScreen/renderBalance').separated
        if (typeof tmp.split === 'undefined') {
            throw new Error('AccountScreen.renderBalance split is undefined')
        }

        tmp = tmp.slice(0, 11)
        const tmps = tmp.split('.')
        let balancePrettyPrep1 = tmps[0]
        let balancePrettyPrep2 = ''
        if (typeof tmps[1] !== 'undefined' && tmps[1]) {
            balancePrettyPrep1 = tmps[0] + '.'
            balancePrettyPrep2 = tmps[1]
        }

        return (
            <AccountGradientBlock
                cleanCache
            >
                <View style={styles.headerContainer}>
                    <Text style={[styles.headerTitle, { color: colors.common.text1 }]}>{strings('FioRequestDetails.balance')}</Text>
                    <BorderedButton
                        text={strings('settings.walletList.generateNew')}
                        onPress={this.handleChangeAddress}
                        activeOpacity={0.8}
                    />
                </View>
                {isSynchronized ?
                    <View style={{ ...styles.topContent__top }}>
                        <View style={{ ...styles.topContent__title, flex: 1 }}>
                            <TouchableOpacity
                                onPressIn={() => this.triggerBalanceVisibility(true, originalVisibility)}
                                onPressOut={() => this.triggerBalanceVisibility(false, originalVisibility)}
                                activeOpacity={1}
                                disabled={originalVisibility}
                                hitSlop={{ top: 10, right: finalIsBalanceVisible ? 60 : 30, bottom: 10, left: finalIsBalanceVisible ? 60 : 30 }}
                            >
                                {finalIsBalanceVisible ? (
                                    <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                                        {balancePrettyPrep1}
                                        <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                                            {`${balancePrettyPrep2} ${currencyCode}`}
                                        </Text>
                                    </Text>
                                ) : (
                                    <Text style={{ ...styles.topContent__title_last, color: colors.common.text1, paddingHorizontal: 15, fontSize: 32, lineHeight: 36 }}>
                                        ****
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {finalIsBalanceVisible && (
                            <LetterSpacing
                                text={basicCurrencySymbol + ' ' + basicCurrencyBalance}
                                textStyle={{ ...styles.topContent__subtitle, color: colors.common.text2 }}
                                letterSpacing={.5}
                            />
                        )}
                    </View> :
                    <View style={styles.topContent__top}>
                        <View style={styles.topContent__title}>
                            <View style={{ height: Platform.OS === 'ios' ? 46 : 51, alignItems: 'center' }}>
                                <Loader size={30} color={colors.accountScreen.loaderColor} />
                            </View>
                        </View>
                    </View>
                }
            </AccountGradientBlock>
        )
    }

    renderTabs = () => {
        return (
            <Tabs active={this.state.index} tabs={this.state.routes} changeTab={this.handleTabChange} />
        )
    }

    handleTabChange = index => {
        const { addresses } = this.state

        const segwitLength = this.filterAddresses(addresses, 'b').length

        const legacyLength = this.filterAddresses(addresses, '1').length

        const num = segwitLength - legacyLength

        const scrollCondition = (num < 0) ? num * -1 : num > 10

        if (scrollCondition) {
            this.handleScroll()
        }

        this.setState({ index })
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

    renderEmptyList = () => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        return (
            <View style={[styles.loader, { marginTop: GRID_SIZE }]}>
                <ActivityIndicator
                    color={colors.common.text1}
                    size='large'
                />
            </View>
        )
    }

    loadMore = () => {
        if (this.state.loading) return
        this.loadAddresses(this.state.addresses.length)
    }

    renderFlatListItem = ({ item }) => {

        const balance = this.getAddressBalance(item)

        return (
            <HdAddressListItem
                address={item.address}
                balance={balance}
                currencyCode='BTC'
                addressName={item.addressName}
                id={item.id}
            />
        )
    }

    renderFirstRoute = () => {

        const { addresses } = this.state

        return (
            <>
                {this.filterAddresses(addresses, 'b').map(item => {
                    const balance = this.getAddressBalance(item)

                    return (
                        <HdAddressListItem
                            address={item.address}
                            balance={balance}
                            currencyCode='BTC'
                            addressName={item.addressName}
                            id={item.id}
                            key={item.id}
                        />
                    )
                })}
            </>
        )
    }

    renderSecondRoute = () => {

        const { addresses } = this.state

        return (
            <>
                {this.filterAddresses(addresses, '1').map(item => {
                    const balance = this.getAddressBalance(item)

                    return (
                        <HdAddressListItem
                            address={item.address}
                            balance={balance}
                            currencyCode='BTC'
                            addressName={item.addressName}
                            id={item.id}
                            key={item.id}
                        />
                    )
                })}
            </>
        )
    }

    getAddressBalance = (item) => {
        return typeof item.balanceTxt === 'undefined' || item.balanceTxt === null ? '0' : BlocksoftPrettyNumbers.setCurrencyCode('BTC').makePretty(item.balanceTxt)
    }

    handleScroll = () => {
        this.flatListRef.scrollToOffset(0)
    }

    handleRefresh = async () => {
        this.setState({ loading: true })
        await this.loadAddresses(0)
        this.setState({ loading: false })
    }

    renderItem = () => (
        <TabView
            style={{ flexGrow: 1 }}
            navigationState={this.state}
            renderScene={this.renderScene}
            renderHeader={null}
            onIndexChange={this.handleTabChange}
            renderTabBar={() => null}
            useNativeDriver
        />
    )

    render() {

        const {
            GRID_SIZE,
            colors
        } = this.context

        return (
            <ScreenWrapper
                title={strings('account.receiveScreen.allAddresses')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
            >
                <FlatList
                    ref={ref => this.flatListRef = ref}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.loading}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.refreshControlIndicator}
                            colors={[colors.common.refreshControlIndicator]}
                            progressBackgroundColor={colors.common.refreshControlBg}
                            progressViewOffset={-20}
                        />
                    }
                    onEndReachedThreshold={0.2}
                    onEndReached={this.loadMore}
                    ListHeaderComponent={() => (
                        <>
                            <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }}>
                                {this.renderHeader()}
                            </View>

                            <View style={{ marginHorizontal: GRID_SIZE }}>
                                {this.renderTabs()}
                            </View>
                        </>
                    )}
                    renderItem={this.renderItem}
                    data={[1]}
                    keyExtractor={index => index}
                />
            </ScreenWrapper>
        )
    }
}

AllAddressesScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedAccountData: getSelectedAccountData(state),
        selectedWalletData: getSelectedWalletData(state),
        originalVisibility: getIsBalanceVisible(state.settingsStore),
        isSegwit: getIsSegwit(state),
        selectedCryptoCurrencyData: getSelectedCryptoCurrencyData(state)
    }
}

export default connect(mapStateToProps)(AllAddressesScreen)

const styles = StyleSheet.create({
    topContent__top: {
        position: 'relative',
        alignItems: 'center',
    },
    currencyName: {
        flexDirection: 'row',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
    },
    topBlock__top_bg: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: 140,
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 16,
    },
    topContent__subtitle: {
        marginTop: -20,
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'center'
    },
    topContent__title_first: {
        height: 36,
        fontSize: 32,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 36,
    },
    topContent__title_last: {
        height: 36,
        fontSize: 16,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 36,
        opacity: 1,
    },
    topContent__bottom: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Platform.OS === 'ios' ? -20 : -30,
        overflow: 'visible'
    },
    topContent__middle: {
        flexDirection: 'row',
        paddingTop: 4,
    },
    topContent__address: {
        marginBottom: 3,
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        color: '#999999'
    },
    headerTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        lineHeight: 22
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    loader: {
        justifyContent: 'center'
    }
})
