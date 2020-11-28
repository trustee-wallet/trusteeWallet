/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import CurrencyIcon from '../../components/elements/CurrencyIcon'

import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'

import { strings } from '../../services/i18n'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import firebase from 'react-native-firebase'


class AddAssetScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            availableCurrencies: [],
            viewCurrencies: [],
            currentSearch: false,
            size: 0,
            initSize: 0
        }
    }

    UNSAFE_componentWillMount() {
        this.setAvailableCurrencies()
        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.setAvailableCurrencies()
        })
    }

    componentWillUnmount() {
        this._onFocusListener.remove()
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({ size: this.state.initSize })
        }, 200)
    }

    setAvailableCurrencies = (cryptoCurrencies) => {


        const { currentSearch } = this.state

        let addedCurrencies = []
        let notAddedCurrencies = []

        const tmpCurrencies = JSON.parse(JSON.stringify(typeof cryptoCurrencies === 'undefined' ? this.props.currencyStore.cryptoCurrencies : cryptoCurrencies))

        for (let currency in BlocksoftDict.Currencies) {

            const tmpCurrency = tmpCurrencies.find((item) => item.currencyCode === currency)

            if (typeof tmpCurrency != 'undefined') {
                const tmp = JSON.parse(JSON.stringify(tmpCurrency))
                addedCurrencies.push(tmp)
            } else {
                const tmp = JSON.parse(JSON.stringify(BlocksoftDict.Currencies[currency]))
                tmp.isHidden = null
                notAddedCurrencies.push(tmp)
            }
        }

        addedCurrencies = addedCurrencies.concat(notAddedCurrencies)


        let newArray
        if (currentSearch) {
            newArray = this._searchInputToViewArray(addedCurrencies, currentSearch)
        }
        if (newArray && newArray.length > 0) {
            this.setState({
                availableCurrencies: addedCurrencies,
                viewCurrencies: newArray
            })
        } else {
            this.setState({
                availableCurrencies: addedCurrencies,
                viewCurrencies: addedCurrencies
            })
        }
    }

    _searchInputToViewArray(cryptoCurrencies, value) {
        let newArray = []
        const lastArray = []

        for (const item of cryptoCurrencies) {
            const currencyName = item.currencyName.toLowerCase()
            const currencyCode = item.currencyCode.toLowerCase()
            if (currencyName.indexOf(value) !== -1 || currencyCode.indexOf(value) !== -1) {
                if (currencyName.indexOf(value) === 0 || currencyCode.indexOf(value) === 0) {
                    newArray.push(item)
                } else {
                    lastArray.push(item)
                }
            } else if (typeof item.tokenAddress !== 'undefined' && item.tokenAddress) {
                if (item.tokenAddress.toLowerCase().indexOf(value) !== -1) {
                    lastArray.push(item)
                }
            }
        }

        if (lastArray && lastArray.length > 0) {
            newArray = newArray.concat(lastArray)
        }
        return newArray
    }

    searchInputCallback = (value) => {
        const tmpArray = this.state.availableCurrencies

        if (value) {
            value = value.trim().toLowerCase()
        }

        if (!value) {
            this.setState({
                viewCurrencies: tmpArray,
                currentSearch: value
            })
        } else {
            const newArray = this._searchInputToViewArray(tmpArray, value)
            this.setState({
                viewCurrencies: newArray,
                currentSearch: value
            })
        }
    }


    handleAddCurrency = async (currencyToAdd) => {
        await currencyActions.addCurrency(currencyToAdd)
        const cryptoCurrencies = await currencyActions.setCryptoCurrencies()
        this.setAvailableCurrencies(cryptoCurrencies)
    }

    handleModal = () => {
        NavStore.goNext('AddCustomTokenScreen')
    }

    /**
     * @param {string} currencyCode
     * @param {integer} isHidden
     */
    toggleCurrencyVisibility = async (currencyCode, isHidden) => {
        currencyActions.toggleCurrencyVisibility({ currencyCode, isHidden })
        const cryptoCurrencies = await currencyActions.setCryptoCurrencies()
        this.setAvailableCurrencies(cryptoCurrencies)
    }

    renderControlButton = (currency) => {

        if (currency.isHidden === null) {
            return (
                <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                    <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={() => {
                        this.handleAddCurrency(currency)
                    }}>
                        <Text style={[styles.btn__text, styles.btn__text_add]}>
                            {strings('assets.addAsset')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        } else if (currency.isHidden) {
            return (
                <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                    <TouchableOpacity style={styles.btn} onPress={() => {
                        this.toggleCurrencyVisibility(currency.currencyCode, +currency.isHidden)
                    }}>
                        <Text style={[styles.btn__text, styles.btn__text_disabled]}>
                            {strings('assets.showAsset')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        } else if (!currency.isHidden) {
            return (
                <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                    <TouchableOpacity style={[styles.btn]} onPress={() => {
                        this.toggleCurrencyVisibility(currency.currencyCode, +currency.isHidden)
                    }}>
                        <Text style={[styles.btn__text]}>
                            {strings('assets.hideAsset')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        }
    }

    handleOnLayout = (event) => {
        this.state.initSize = this.state.initSize < event.nativeEvent.layout.width ? event.nativeEvent.layout.width : this.state.initSize
    }

    render() {
        firebase.analytics().setCurrentScreen('AddAssetScreen.index')

        const { viewCurrencies } = this.state

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('assets.mainTitle')}
                    searchInputCallback={this.searchInputCallback}
                />
                <View style={styles.wrapper__content}>
                    <View>
                        <TouchableOpacity style={styles.addButton} onPress={() => this.handleModal()}>
                            <Text style={styles.addButton__text}>
                                {strings('assets.addCustomAsset')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        <View style={styles.content__left}>
                            <View style={styles.content__left__bg}/>
                            <ScrollView
                                style={styles.availableCurrencies}
                                showsVerticalScrollIndicator={false}>
                                {
                                    viewCurrencies.map((item, index) => {
                                        return (
                                            <View key={index}>
                                                <View
                                                    key={index}
                                                    style={styles.availableCurrencies__item}>
                                                    <CurrencyIcon currencyCode={item.currencyCode}
                                                                  markStyle={{ top: 30 }}/>
                                                    <View style={styles.availableCurrencies__text}>
                                                        <Text style={styles.availableCurrencies__text_name}
                                                              numberOfLines={1}>{item.currencyName}</Text>
                                                        <Text
                                                            style={styles.availableCurrencies__text_symbol}>{item.currencySymbol}</Text>
                                                    </View>
                                                    {
                                                        this.renderControlButton(item)
                                                    }
                                                </View>
                                                <View style={styles.availableCurrencies__line}/>
                                            </View>

                                        )
                                    })
                                }
                            </ScrollView>
                        </View>
                        <View style={styles.content__right}>
                            <View>

                            </View>
                            <ScrollView>

                            </ScrollView>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        currencyStore: state.currencyStore
    }
}

export default connect(mapStateToProps, {})(AddAssetScreen)

const styles = {
    wrapper: {
        flex: 1,

        backgroundColor: '#fff'
    },
    wrapper__content: {
        flex: 1,

        paddingRight: 15,
        paddingLeft: 15,
        marginTop: 130
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        width: '100%'
    },
    content__left: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
        backgroundColor: '#f9f9f9',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
    },
    content__left__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 1000

    },
    content__right: {},
    addButton: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 44
    },
    addButton__text: {
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9'
    },
    availableCurrencies: {
        flex: 1,
        width: '100%'
    },
    availableCurrencies__item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: 10
    },
    availableCurrencies__line: {
        marginLeft: 15,
        marginRight: 15,
        height: 1,
        marginTop: 10,
        backgroundColor: '#f0f0f0'
    },
    availableCurrencies__text: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 15
    },
    availableCurrencies__text_symbol: {
        fontSize: 12,
        color: '#999999'
    },
    availableCurrencies__text_name: {
        paddingRight: 10,

        fontSize: 16,
        color: '#404040'
    },
    availableCurrencies__btn: {
        paddingLeft: 15,
        paddingRight: 15,
        height: 35,
        marginLeft: 'auto'
    },
    btn: {
        alignItems: 'center',

        padding: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,

        backgroundColor: '#fff',
        borderRadius: 10
    },
    btn__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9'
    },
    btn__text_disabled: {
        color: '#404040'
    },
    btn__text_add: {
        color: '#f4f4f4',
        backgroundColor: '#864dd9'
        // color: '#7127ac',
    }
}
