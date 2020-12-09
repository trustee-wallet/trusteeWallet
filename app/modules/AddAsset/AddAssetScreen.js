
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
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import { strings } from '../../services/i18n'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import TextInput from '../../components/elements/new/TextInput'
import ListItem from '../../components/elements/new/list/ListItem/Asset'
import Tabs from '../../components/elements/new/Tabs'
import QrCodeIcon from '../../assets/images/qrCodeBtn';


const ASSESTS_GROUP = {
    ALL: 'ALL',
    COINS: 'COINS',
    TOKENS: 'TOKENS',
    CUSTOM: 'CUSTOM',
}

const ALLOWED_ASSETS = [
    ASSESTS_GROUP.ALL,
    ASSESTS_GROUP.COINS,
    ASSESTS_GROUP.TOKENS,
    ASSESTS_GROUP.CUSTOM,
]


class AddAssetScreen extends React.Component {
    state = {
        headerHeight: 0,
        searchQuery: '',
        tabs: [
            {
                title: strings('assets.tabAll'),
                index: 0,
                active: true,
                group: ASSESTS_GROUP.ALL
            },
            {
                title: strings('assets.tabCoins'),
                index: 1,
                active: false,
                group: ASSESTS_GROUP.COINS
            },
            {
                title: strings('assets.tabTokens'),
                index: 2,
                active: false,
                group: ASSESTS_GROUP.TOKENS
            },
            {
                title: strings('assets.tabCustom'),
                index: 3,
                active: false,
                group: ASSESTS_GROUP.CUSTOM
            },
        ],
        data: []
    }

    componentDidMount() {
        this.prepareData()
    }

    prepareData = (assets = this.props.assets, newTab, searchQuery) => {
        if (typeof searchQuery !== 'string') searchQuery = this.state.searchQuery
        const { tabs } = this.state
        const activeTab = newTab || tabs.find(tab => tab.active)
        const newTabs = tabs.map(tab => ({ ...tab, active: tab.index === activeTab.index }))

        const notAddedAssets = []
        _forEach(BlocksoftDict.Currencies, (currency, currencyCode) => {
            let tmpCurrency = assets.find(as => as.currencyCode === currencyCode)
            if (typeof tmpCurrency === 'undefined') {
                tmpCurrency = JSON.parse(JSON.stringify(BlocksoftDict.Currencies[currencyCode]))
                tmpCurrency.isHidden = null
                notAddedAssets.push(tmpCurrency)
            }
        })
        const fullData = [...assets, ...notAddedAssets]
        let data = []

        if (searchQuery) data = this.filterBySearchQuery(fullData, searchQuery)

        if (activeTab.group === ASSESTS_GROUP.ALL && !searchQuery) data = fullData

        if (activeTab.group === ASSESTS_GROUP.COINS && !searchQuery) data = fullData.filter(as => as.currencyType === 'coin')

        if (activeTab.group === ASSESTS_GROUP.TOKENS && !searchQuery) {
            const dataGrouped = fullData.reduce((grouped, asset) => {
                if (asset.currencyType !== 'token') return grouped
                if (!grouped[asset.tokenBlockchain]) grouped[asset.tokenBlockchain] = []
                grouped[asset.tokenBlockchain].push(asset)
                return grouped
            }, {})

            _forEach(dataGrouped, (arr, tokenBlockchain) => {
                data.push({
                    title: tokenBlockchain,
                    data: arr
                })
            })
        }

        this.setState(() => ({ data, tabs: newTabs, searchQuery }))
    }

    filterBySearchQuery = (assets, value) => {
        value = value.toLowerCase()
        return assets.filter(as => (
            as.currencySymbol.toLowerCase().includes(value)
            || as.currencyName.toLowerCase().includes(value)
        ))
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleSearch = (value) => {
        this.prepareData(undefined, undefined, value)
    }

    handleBack = () => { NavStore.goBack() }

    handleChangeTab = (newTab) => {
        this.prepareData(undefined, { ...newTab, active: true })
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

    handleChangeCurrencyStatus = (currency) => {
        if (currency.isHidden === null) {
            this.handleAddCurrency(currency)
        } else {
            this.toggleCurrencyVisibility(currency.currencyCode, +currency.isHidden)
        }
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

    render() {
        const { colors, GRID_SIZE } = this.context
        const {
            headerHeight,
            data,
            searchQuery,
            tabs
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
                        activeGroup === ASSESTS_GROUP.CUSTOM ? (
                            <View>
                                <View style={[{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE, paddingBottom: GRID_SIZE / 2 }]}>
                                    {this.renderTabs()}
                                </View>
                                <View style={{ paddingHorizontal: GRID_SIZE }}>
                                    <TextInput
                                        label={strings('assets.addCustomLabel')}
                                        labelColor={colors.common.text3}
                                        placeholder={strings('assets.addCustomPlaceholder')}
                                        HelperAction={() => (
                                            <TouchableOpacity>
                                                <QrCodeIcon width={20} height={20} color={colors.common.text1} />
                                            </TouchableOpacity>
                                        )}
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
}


const mapStateToProps = (state) => {
    return {
        assets: state.currencyStore.cryptoCurrencies
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
    tabs: {
        // borderWidth: 1,
        justifyContent: 'space-around',
        marginBottom: 0
    },
    tab: {
        // borderWidth: 1,
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
