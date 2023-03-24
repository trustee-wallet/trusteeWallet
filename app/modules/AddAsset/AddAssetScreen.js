/**
 * @version 0.77
 * @author Vadym
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    SafeAreaView,
    SectionList,
    StyleSheet,
    Keyboard,
    ActivityIndicator
} from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import Validator from '@app/services/UI/Validator/Validator'
import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import TextInput from '@app/components/elements/new/TextInput'
import Button from '@app/components/elements/new/buttons/Button'
import ListItem from '@app/components/elements/new/list/ListItem/Asset'
import Tabs from '@app/components/elements/new/Tabs'
import Header from './elements/Header'

import {
    getTabs,
    ASSESTS_GROUP,
    prepareDataForDisplaying,
    addCustomToken,
    prepareAssets
} from './helpers'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import { setBseLink } from '@app/appstores/Stores/Main/MainStoreActions'

import { FlatList } from 'react-native-gesture-handler'
import AssetFlatListItem from './elements/AssetFlatListItem'

import PercentView from '@app/components/elements/new/PercentView'
import { getStakingCoins } from '@app/appstores/Stores/Main/selectors'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'
import OneUtils from '@crypto/blockchains/one/ext/OneUtils'
import { getVisibleAssets } from '@app/appstores/Stores/Currency/selectors'


class AddAssetScreen extends React.PureComponent {
    state = {
        headerHeight: 109,
        searchQuery: '',
        customAddress: '',
        tabs: getTabs(),
        data: [],
        tokenBlockchain: 0,
        tokenBlockchainArray: [],
        headerHasExtraView: true,
        onLoading: false
    }

    componentDidMount() {
        const currencyCode = NavStore.getParamWrapper(this, 'currencyCode')
        if (currencyCode) {
            currencyCode.forEach(code => {
                let item = prepareAssets(this.props.assets).find(way => way.currencyCode === code)
                item && this.handleChangeCurrencyStatus(item)
            })
        }
        this.prepareData()
    }

    prepareData = (assets = this.props.assets, newTab, searchQuery) => {
        prepareDataForDisplaying.call(this, assets, newTab, searchQuery)
    }

    handleSearch = (value) => {
        this.prepareData(undefined, undefined, value)
    }

    handleBack = () => { NavStore.goBack() }

    handleChangeTab = (newTab) => {
        Keyboard.dismiss()
        this.prepareData(undefined, { ...newTab, active: true })
    }

    handleChangeCurrencyStatus = (currency) => {
        if (currency.isHidden === null) {
            this.handleAddCurrency(currency, currency.tokenBlockchain)
        } else {
            this.toggleCurrencyVisibility(currency.currencyCode, currency.isHidden * 1 > 0 ? 0 : 1, currency.isHidden, currency.tokenBlockchain)
        }
        setBseLink(null)
    }

    handleAddCurrency = async (currencyToAdd, tokenBlockchain) => {
        Keyboard.dismiss()
        MarketingEvent.logEvent('gx_currency_add', { currencyCode: currencyToAdd.currencyCode }, 'GX')
        if (await currencyActions.addCurrency(currencyToAdd)) {
            await currencyActions.addOrShowMainCurrency(currencyToAdd.currencyCode, tokenBlockchain)
        }
        this.prepareData()
    }

    toggleCurrencyVisibility = async (currencyCode, newIsHidden, currentIsHidden, tokenBlockchain) => {
        Keyboard.dismiss()
        if (newIsHidden) {
            MarketingEvent.logEvent('gx_currency_hide', { currencyCode, source: 'AddAssetScreen' }, 'GX')
        } else {
            MarketingEvent.logEvent('gx_currency_show', { currencyCode, source: 'AddAssetScreen' }, 'GX')
            await currencyActions.addOrShowMainCurrency(currencyCode, tokenBlockchain)
        }
        await currencyActions.toggleCurrencyVisibility({ currencyCode, newIsHidden, currentIsHidden : 0}) // add to all wallets
        this.prepareData()
    }

    handleOpenQr = () => {
        setQRConfig({ flowType: QRCodeScannerFlowTypes.ADD_CUSTOM_TOKEN_SCANNER, callback : (data) => {
            try {
                this.setState({ customAddress: data })
            } catch (e) {
                Log.log('QRCodeScannerScreen callback error ' + e.message )
                Toast.setMessage(e.message).show()
            }
            NavStore.goBack()
        }})
        NavStore.goNext('QRCodeScannerScreen')
    }

    handleChangeCustomAddress = (value) => { this.setState(() => ({ customAddress: Validator.safeWords(value) })) }

    handleAddCustomToken = async (value) => {
        Keyboard.dismiss()
        const customAddress = value.trim().split(/\s+/g).join('').replace('/', '').replace('.', '')

        const validationETH = await Validator.userDataValidation({
            type: 'ETH_ADDRESS',
            id: 'address',
            value: customAddress
        })
        if (validationETH === false) { // valid eth address
            const result = await addCustomToken(customAddress, 'ETH_ERC_20')
            if (result.searchQuery) {
                this.handleSearch(result.searchQuery)
            }
            return false
        }

        const types = ['TRX_ADDRESS', 'TRX_TOKEN']
        const tmps = types.map(type => ({
            type,
            id: 'address',
            value: customAddress
        }))
        const validation = await Validator.arrayValidation(tmps)
        if (validation.errorArr.length !== types.length) {
            const result = await addCustomToken(customAddress, 'TRX')
            if (result.searchQuery) {
                this.handleSearch(result.searchQuery)
            }
            return false
        }

        const validationONE = await Validator.userDataValidation({
            type: 'ETH_ONE_ADDRESS',
            id: 'address',
            value: customAddress
        })

        if (validationONE === false) { // valid address
            let oneCustomAddress = customAddress
            if (OneUtils.isOneAddress(customAddress)) {
                oneCustomAddress = OneUtils.fromOneAddress(customAddress)
            }
            const result = await addCustomToken(oneCustomAddress, 'ONE_ERC_20')
            if (result.searchQuery) {
                this.handleSearch(result.searchQuery)
            }
            return false
        }

        const validationSOL = await Validator.userDataValidation({
            type: 'SOL_ADDRESS',
            id: 'address',
            value: customAddress
        })

        if (validationSOL === false) { // valid address
            const result = await addCustomToken(customAddress, 'SOL')
            if (result.searchQuery) {
                this.handleSearch(result.searchQuery)
            }
            return false
        }

        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: strings('modal.exchange.sorry'),
            description: strings('validator.invalidFormat')
        })

    }

    updateOffset = (event) => {
        const scrollOffset = Math.round(event.nativeEvent.contentOffset.y)
        if (this.state.headerHasExtraView && scrollOffset > 100) this.setState(() => ({ headerHasExtraView: false }))
        if (!this.state.headerHasExtraView && scrollOffset < 100) this.setState(() => ({ headerHasExtraView: true }))
    }

    get commonHeaderProps() {
        const { GRID_SIZE, colors } = this.context
        const contentPaddingTop = this.state.headerHeight + GRID_SIZE / 2
        return {
            showsVerticalScrollIndicator: false,
            contentContainerStyle: { paddingBottom: GRID_SIZE, paddingTop: contentPaddingTop },
            ItemSeparatorComponent: () => <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 5, marginRight: GRID_SIZE * 2 }} />,
            renderItem: params => this.renderListItem(params),
            keyExtractor: item => item.currencyCode,
            // keyboardShouldPersistTaps: 'handled',
            // keyboardDismissMode: 'on-drag',
            ListEmptyComponent: () => this.renderEmptyList(),
            // onScroll: e => this.updateOffset(e)
        }
    }

    renderTokenFlatList = (data) => {
        return (
            <FlatList
                data={data}
                keyExtractor={({ index }) => index}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                renderItem={this.renderFlatListItem}
                initialScrollIndex={this.state.tokenBlockchain}
                getItemLayout={(data, index) => (
                    {length: index, offset: 60 * index, index}
                  )}
            />
        )
    }

    renderFlatListItem = ({ item, index }) => {
        return (
            <AssetFlatListItem
                data={item.title}
                margin={index === 0}
                inverse={index === this.state.tokenBlockchain}
                action={() => {
                    this.setState({
                        onLoading: true,
                        tokenBlockchain: index,
                        tokenBlockchainArray: this.state.data[index !== 0 ? index - 1 : 0].data,
                    })
                    setTimeout(() => {
                            this.setState({
                                onLoading: false
                            })
                        }, 1000)
                }}
            />
        )
    }

    renderTokenHeader = (data) => {

        const { GRID_SIZE } = this.context

        data = data.map(item => ({
            data: item.data,
            title: item.title === 'BINANCE SMART CHAIN (BEP-20)' ? item.title = 'BSC (BEP-20)' : item.title,
        }))

        return(
            <View>
                <View>
                    {this.renderTabs(true)}
                </View>
                <View style={{ marginTop: -GRID_SIZE / 2, marginBottom: GRID_SIZE * 1.5, flexGrow: 1 }}>
                    {this.renderTokenFlatList([{title: 'ALL', data: []}, ...data])}
                </View>
            </View>
        )
    }

    renderLoader = () => {

        const { colors } = this.context

        return(
            <View>
                <ActivityIndicator
                    color={colors.common.text1}
                    size='large'
                />
            </View>
        )
    }

    renderCustomTextInput = () => (
        <TextInput
            label={strings('assets.addCustomLabel')}
            labelColor={this.context.colors.common.text3}
            placeholder={strings('assets.addCustomPlaceholder')}
            onChangeText={this.handleChangeCustomAddress}
            value={this.state.customAddress}
            paste={true}
            callback={this.handleChangeCustomAddress}
            qr={true}
            qrCallback={this.handleOpenQr}
            onBlur={() => null}
        />
    )

    render() {
        const { colors, GRID_SIZE } = this.context
        const {
            data,
            searchQuery,
            tabs,
            headerHasExtraView
        } = this.state
        const activeGroup = tabs.find(tab => tab.active).group

        MarketingAnalytics.setCurrentScreen('AddAssetScreen')

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    rightType="close"
                    rightAction={this.handleBack}
                    title={strings('assets.title')}
                    headerHasExtraView={headerHasExtraView}
                    searchQuery={searchQuery}
                    onSearch={this.handleSearch}
                />
                <SafeAreaView style={[styles.content, { backgroundColor: colors.common.background }]}>
                    {
                        activeGroup === ASSESTS_GROUP.CUSTOM && !searchQuery ? (
                            <FlatList
                                {...this.commonHeaderProps}
                                ListEmptyComponent={null}
                                data={data}
                                ListHeaderComponent={this.state.searchQuery ? null :
                                <TouchableDebounce style={{ flex: 1, marginBottom: GRID_SIZE }} activeOpacity={1} >
                                    {this.renderTabs(false)}
                                    <View style={[styles.customAddressConent, { marginHorizontal: GRID_SIZE }]}>
                                        {this.renderCustomTextInput()}
                                        <Button
                                            containerStyle={{ marginTop: GRID_SIZE * 2 }}
                                            title={strings('assets.addAssetButton')}
                                            onPress={() => this.handleAddCustomToken(this.state.customAddress)}
                                            disabled={!this.state.customAddress}
                                        />
                                    </View>
                                </TouchableDebounce>}
                            />
                        ) : activeGroup === ASSESTS_GROUP.TOKENS && !searchQuery
                            ? this.state.tokenBlockchain ? (
                                <FlatList
                                    {...this.commonHeaderProps}
                                    data={this.state.onLoading ? null : this.state.tokenBlockchainArray}
                                    ListHeaderComponent={searchQuery ? null : () => (
                                        this.renderTokenHeader(data)
                                    )}
                                    ListEmptyComponent={() => this.renderLoader()}
                                />
                            ) :
                                 (
                                    <SectionList
                                        {...this.commonHeaderProps}
                                        sections={this.state.onLoading ? null : data}
                                        stickySectionHeadersEnabled={false}
                                        ListHeaderComponent={searchQuery ? null : () => (
                                            this.renderTokenHeader(data)
                                        )}
                                        renderSectionHeader={({ section: { title } }) => <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE * 3 }]}>{title}</Text>}
                                        renderSectionFooter={() => <View style={{ flex: 1, height: GRID_SIZE * 2 }} />}
                                        ListEmptyComponent={() => this.renderLoader()}
                                    />
                                ) :
                                (
                                    <FlatList
                                        {...this.commonHeaderProps}
                                        data={data}
                                        ListHeaderComponent={searchQuery ? null : () => this.renderTabs(false)}
                                    />
                                )
                    }
                </SafeAreaView>
            </View>
        )
    }

    renderEmptyList = () => {
        const { colors, GRID_SIZE } = this.context
        let { searchQuery } = this.state



        let isSearchTokenAddress = false
        if (searchQuery) {
            searchQuery = searchQuery.trim()
            if (searchQuery.toLowerCase().indexOf('0x') === 0 && searchQuery.length === 42) {
                isSearchTokenAddress = true
            } else if (searchQuery.indexOf('T') === 0 && searchQuery.length === 34) {
                isSearchTokenAddress = true
            } else if (searchQuery.indexOf('one1') === 0 && searchQuery.length >= 20) {
                isSearchTokenAddress = true
            }
        }

        if (isSearchTokenAddress) {
            return (
                <View style={{ alignSelf: 'center', marginTop: GRID_SIZE * 6, marginHorizontal: GRID_SIZE * 2 }}>
                    <TouchableDebounce style={{ flex: 1, marginBottom: GRID_SIZE }} activeOpacity={1} onPress={Keyboard.dismiss}>
                        <View style={[styles.customAddressConent, { marginHorizontal: -GRID_SIZE }]}>
                            <Button
                                containerStyle={{ marginTop: GRID_SIZE * 2 }}
                                title={strings('assets.addAssetButton') + ' ' + searchQuery}
                                onPress={() => this.handleAddCustomToken(searchQuery)}
                            />
                        </View>
                    </TouchableDebounce>
                </View>
            )
        } else {
            return (
                <View style={{ alignSelf: 'center', marginTop: GRID_SIZE * 6 }}>
                    <Text style={[styles.emptyText, { color: colors.common.text2 }]}>{strings('assets.noAssetsFound')}</Text>
                </View>
            )
        }
    }

    renderTabs = (isSection) => {

        const { GRID_SIZE } = this.context
        return (
            <Tabs
                tabs={this.state.tabs}
                changeTab={this.handleChangeTab}
                containerStyle={[styles.tabs, { paddingHorizontal: GRID_SIZE }]}
                tabStyle={[styles.tab, { paddingTop: GRID_SIZE / 2, paddingBottom: isSection ? (GRID_SIZE * 1.5) : GRID_SIZE, }]}
            />
        )
    }

    renderListItem = ({ item }) => {

        const { GRID_SIZE } = this.context

        const availableStaking = typeof this.props.stakingCoins[item.currencyCode] !== 'undefined' && this.props.stakingCoins[item.currencyCode]*1 > 0

        return (
            <View style={{ marginHorizontal: GRID_SIZE * 2 }}>
                <ListItem
                    title={item.currencyName}
                    subtitle={item.currencySymbol}
                    iconType={item.currencyCode}
                    onPress={() => this.handleChangeCurrencyStatus(item)}
                    rightContent="switch"
                    switchParams={{ value: item.isHidden !== null && !item.maskedHidden, onPress: () => this.handleChangeCurrencyStatus(item) }}
                    TitleExtraView={() => {
                        if (availableStaking) {
                            return (
                                <PercentView
                                    value={this.props.stakingCoins[item.currencyCode]}
                                    staking
                                />
                            )
                        } else {
                            return null
                        }
                    }}
                />
            </View>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        // assets: state.currencyStore.cryptoCurrencies,
        assets: getVisibleAssets(state),
        stakingCoins: getStakingCoins(state)
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

AddAssetScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(AddAssetScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
    customAddressConent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    tabs: {
        justifyContent: 'space-around',
        marginBottom: 0
    },
    tab: {
        flex: 1
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    emptyText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
        flex: 2,
    },
})
