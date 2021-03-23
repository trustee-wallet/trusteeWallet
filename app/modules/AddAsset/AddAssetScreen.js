
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    SectionList,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Keyboard
} from 'react-native'

import _forEach from 'lodash/forEach'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import NavStore from '../../components/navigation/NavStore'

import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import Validator from '../../services/UI/Validator/Validator'
import { setQRConfig, setQRValue } from '../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'

import { strings } from '../../services/i18n'
import { checkQRPermission } from '../../services/UI/Qr/QrPermissions'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import TextInput from '../../components/elements/new/TextInput'
import Button from '../../components/elements/new/buttons/Button'
import ListItem from '../../components/elements/new/list/ListItem/Asset'
import Tabs from '../../components/elements/new/Tabs'
import Header from './elements/Header'

import QrCodeIcon from '../../assets/images/qrCodeBtn';

import {
    getTabs,
    ASSESTS_GROUP,
    prepareDataForDisplaying,
    addCustomToken
} from './helpers'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'


class AddAssetScreen extends React.Component {
    state = {
        headerHeight: 109,
        searchQuery: '',
        customAddress: '',
        tabs: getTabs(),
        data: [],
        headerHasExtraView: true
    }

    navigationListener;

    componentDidMount() {
        this.prepareData()
        this.navigationListener = this.props.navigation.addListener('didFocus', this.checkIfWasScanned)
    }

    checkIfWasScanned = () => {
        const data = this.props.navigation.getParam('tokenData')
        if (data && typeof data !== 'undefined' && typeof data.address !== 'undefined' && data.address) {
            this.setState({ customAddress: data.address })
        }
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
            this.handleAddCurrency(currency)
        } else {
            this.toggleCurrencyVisibility(currency.currencyCode, +currency.isHidden)
        }
        return;
    }

    handleAddCurrency = async (currencyToAdd) => {
        await currencyActions.addCurrency(currencyToAdd)
        this.prepareData()
    }

    toggleCurrencyVisibility = async (currencyCode, isHidden) => {
        await currencyActions.toggleCurrencyVisibility({ currencyCode, isHidden })
        this.prepareData()
    }

    handleOpenQr = () => {
        setQRConfig({
            title: strings('modal.qrScanner.success.title'),
            description: strings('modal.qrScanner.success.description'),
            type: 'ADD_CUSTOM_TOKEN_SCANNER'
        })
        setQRValue('')
        NavStore.goNext('QRCodeScannerScreen')
    }

    handleChangeCustomAddress = (value) => { this.setState(() => ({ customAddress: value })) }

    handleAddCustomToken = async () => {
        const types = ['ETH_ADDRESS', 'TRX_ADDRESS', 'TRX_TOKEN']
        const { customAddress } = this.state
        const tmps = types.map(type => ({
            type,
            id: 'address',
            value: customAddress
        }))
        const validation = await Validator.arrayValidation(tmps)

        if (validation.errorArr.length !== types.length) addCustomToken(customAddress)
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
            contentContainerStyle: { paddingHorizontal: GRID_SIZE * 2, paddingBottom: GRID_SIZE, paddingTop: contentPaddingTop },
            ItemSeparatorComponent: () => <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 2 }} />,
            renderItem: params => this.renderListItem(params),
            keyExtractor: item => item.currencyCode,
            keyboardShouldPersistTaps: 'handled',
            keyboardDismissMode: 'on-drag',
            ListEmptyComponent: () => this.renderEmptyList(),
            onScroll: e => this.updateOffset(e)
        }
    }

    render() {
        const { colors, GRID_SIZE } = this.context
        const {
            headerHeight,
            data,
            searchQuery,
            tabs,
            customAddress,
            headerHasExtraView
        } = this.state
        const activeGroup = tabs.find(tab => tab.active).group

        MarketingAnalytics.setCurrentScreen('AddAssetScreen')

        const contentPaddingTop = headerHeight + GRID_SIZE / 2

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
                            <TouchableOpacity style={{ flex: 1, paddingBottom: GRID_SIZE * 2, paddingTop: contentPaddingTop }} activeOpacity={1} onPress={Keyboard.dismiss}>
                                <View style={[{ paddingHorizontal: GRID_SIZE * 2, paddingBottom: GRID_SIZE / 2 }]}>
                                    {this.renderTabs()}
                                </View>
                                <View style={[styles.customAddressConent, { paddingHorizontal: GRID_SIZE }]}>
                                    <TextInput
                                        label={strings('assets.addCustomLabel')}
                                        labelColor={colors.common.text3}
                                        placeholder={strings('assets.addCustomPlaceholder')}
                                        onChangeText={this.handleChangeCustomAddress}
                                        value={customAddress}
                                        HelperAction={() => (
                                            <TouchableOpacity onPress={() => checkQRPermission(this.handleOpenQr)}>
                                                <QrCodeIcon width={20} height={20} color={colors.common.text1} />
                                            </TouchableOpacity>
                                        )}
                                    />
                                    <Button
                                        title={strings('assets.addAssetButton')}
                                        onPress={this.handleAddCustomToken}
                                        disabled={!customAddress}
                                    />
                                </View>
                            </TouchableOpacity>
                        ) : activeGroup === ASSESTS_GROUP.TOKENS && !searchQuery
                                ? (
                                    <SectionList
                                        {...this.commonHeaderProps}
                                        sections={data}
                                        stickySectionHeadersEnabled={false}
                                        ListHeaderComponent={!!searchQuery ? null : () => this.renderTabs(true)}
                                        renderSectionHeader={({ section: { title } }) => <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{title}</Text>}
                                        renderSectionFooter={() => <View style={{ flex: 1, height: GRID_SIZE * 2 }} />}
                                    />
                                ) : (
                                    <FlatList
                                        {...this.commonHeaderProps}
                                        data={data}
                                        ListHeaderComponent={!!searchQuery ? null : () => this.renderTabs(false)}
                                    />
                                )
                    }
                </SafeAreaView>
            </View>
        )
    }

    renderEmptyList = () => {
        const { colors, GRID_SIZE } = this.context
        return (
            <View style={{ alignSelf: 'center', marginTop: GRID_SIZE * 6 }}>
                <Text style={[styles.emptyText, { color: colors.common.text2 }]}>{strings('assets.noAssetsFound')}</Text>
            </View>
        )
    }

    renderTabs = (isSection) => (
        <Tabs
            tabs={this.state.tabs}
            changeTab={this.handleChangeTab}
            containerStyle={[styles.tabs, {}]}
            tabStyle={[styles.tab, { paddingTop: this.context.GRID_SIZE / 2, paddingBottom: isSection ? (this.context.GRID_SIZE * 1.5) : this.context.GRID_SIZE, }]}
        />
    )

    renderListItem = ({ item }) => {
        return (
            <ListItem
                title={item.currencyName}
                subtitle={item.currencySymbol}
                iconType={item.currencyCode}
                onPress={() => this.handleChangeCurrencyStatus(item)}
                rightContent="switch"
                switchParams={{ value: item.isHidden === 0, onPress: () => this.handleChangeCurrencyStatus(item) }}
            />
        )
    }
}


const mapStateToProps = (state) => {
    return {
        assets: state.currencyStore.cryptoCurrencies,
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
        flex: 0
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
