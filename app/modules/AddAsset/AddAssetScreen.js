
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
    InteractionManager
} from 'react-native'
import firebase from 'react-native-firebase'
import _forEach from 'lodash/forEach'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import NavStore from '../../components/navigation/NavStore'

import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'
import Validator from '../../services/UI/Validator/Validator'
import { setQRConfig, setQRValue } from '../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'

import { strings } from '../../services/i18n'
import { checkQRPermission } from '../../services/UI/Qr/QrPermissions'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import TextInput from '../../components/elements/new/TextInput'
import Button from '../../components/elements/new/buttons/Button'
import ListItem from '../../components/elements/new/list/ListItem/Asset'
import Tabs from '../../components/elements/new/Tabs'

import QrCodeIcon from '../../assets/images/qrCodeBtn';

import {
    TABS,
    ASSESTS_GROUP,
    prepareDataForDisplaying,
    addCustomToken
} from './helpers'


class AddAssetScreen extends React.Component {
    state = {
        headerHeight: 0,
        searchQuery: '',
        customAddress: '',
        tabs: TABS,
        data: []
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

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        if (headerHeight > this.state.headerHeight) this.setState(() => ({ headerHeight }))
    }

    handleSearch = (value) => {
        this.prepareData(undefined, undefined, value)
    }

    handleBack = () => { NavStore.goBack() }

    handleChangeTab = (newTab) => {
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
        const cryptoCurrencies = await currencyActions.setCryptoCurrencies()
        this.prepareData(cryptoCurrencies)
    }

    toggleCurrencyVisibility = async (currencyCode, isHidden) => {
        currencyActions.toggleCurrencyVisibility({ currencyCode, isHidden })
        const cryptoCurrencies = await currencyActions.setCryptoCurrencies()
        this.prepareData(cryptoCurrencies)
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

    render() {
        const { colors, GRID_SIZE } = this.context
        const {
            headerHeight,
            data,
            searchQuery,
            tabs,
            customAddress
        } = this.state
        const activeGroup = tabs.find(tab => tab.active).group

        firebase.analytics().setCurrentScreen('AddAssetScreen')

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    rightType="close"
                    rightAction={this.handleBack}
                    title={strings('assets.title')}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={this.renderSearch}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    {
                        activeGroup === ASSESTS_GROUP.CUSTOM && !searchQuery ? (
                            <View style={{ flex: 1, paddingBottom: GRID_SIZE * 2 }}>
                                <View style={[{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE, paddingBottom: GRID_SIZE / 2 }]}>
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
                            </View>
                        ) : activeGroup === ASSESTS_GROUP.TOKENS && !searchQuery
                            ? (
                                <SectionList
                                    showsVerticalScrollIndicator={false}
                                    sections={data}
                                    stickySectionHeadersEnabled={false}
                                    ListHeaderComponent={!!searchQuery ? null : () => this.renderTabs(true)}
                                    contentContainerStyle={{ paddingHorizontal: GRID_SIZE * 2, paddingVertical: GRID_SIZE }}
                                    renderItem={this.renderListItem}
                                    renderSectionHeader={({ section: { title } }) => <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{title}</Text>}
                                    renderSectionFooter={() => <View style={{ flex: 1, height: GRID_SIZE * 2 }} />}
                                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 2 }} />}
                                    keyExtractor={item => item.currencyCode}
                                    keyboardDismissMode="on-drag"
                                />
                            ) : (
                                <FlatList
                                    data={data}
                                    renderItem={this.renderListItem}
                                    keyExtractor={item => item.currencyCode}
                                    contentContainerStyle={{ paddingHorizontal: GRID_SIZE * 2, paddingVertical: GRID_SIZE }}
                                    ListHeaderComponent={!!searchQuery ? null : () => this.renderTabs(false)}
                                    showsVerticalScrollIndicator={false}
                                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 2 }} />}
                                    keyboardDismissMode="on-drag"
                                />
                            )
                    }
                </SafeAreaView>
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

    renderSearch = () => (
        <View style={{ marginHorizontal: -this.context.GRID_SIZE }}>
            <TextInput
                placeholder={strings('assets.searchPlaceholder')}
                value={this.state.searchQuery}
                onChangeText={this.handleSearch}
                HelperAction={() => <AntDesignIcon name="search1" size={23} color={this.context.colors.common.text2} />}
            />
        </View>
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
        justifyContent: 'space-between'
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
        lineHeight: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
})
