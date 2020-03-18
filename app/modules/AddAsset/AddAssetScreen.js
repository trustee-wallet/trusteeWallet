import React, { Component } from 'react'

import { connect } from 'react-redux'

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity
} from 'react-native'

import Navigation from "../../components/navigation/Navigation"
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import Button from '../../components/elements/Button'
import ButtonLine from '../../components/elements/ButtonLine'

import { showModal } from "../../appstores/Actions/ModalActions"
import currencyActions from '../../appstores/Actions/CurrencyActions'

import { setCurrencies } from '../../appstores/Actions/MainStoreActions'

import { strings } from '../../services/i18n'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import firebase from "react-native-firebase"



class AddAssetScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            availableCurrencies: [],
            size: 0,
            initSize: 0
        }
    }

    UNSAFE_componentWillMount() {
        this.setAvailableCurrencies()
    }

    componentDidMount(){
        setTimeout(() => {
            this.setState({ size: this.state.initSize })
        }, 200)
    }

    setAvailableCurrencies = (currencies) => {

        let addedCurrencies = []
        let notAddedCurrencies = []

        const tmpCurrencies = JSON.parse(JSON.stringify(typeof currencies == 'undefined' ? this.props.mainStore.currencies : currencies))

        for (let currency in BlocksoftDict.Currencies) {

            const tmpCurrency = tmpCurrencies.find((item) => item.currencyCode === currency)

            if(typeof tmpCurrency != 'undefined'){
                const tmp = JSON.parse(JSON.stringify(tmpCurrency))
                addedCurrencies.push(tmp)
            } else {
                const tmp = JSON.parse(JSON.stringify(BlocksoftDict.Currencies[currency]))
                tmp.is_hidden = null
                notAddedCurrencies.push(tmp)
            }
        }

        this.setState({
            availableCurrencies: addedCurrencies.concat(notAddedCurrencies)
        })

    }

    handleAddCurrency = async (currencyToAdd) => {
        await currencyActions.addCurrency(currencyToAdd)

        const currencies = await setCurrencies()

        this.setAvailableCurrencies(currencies)
    }

    handleModal = () => {
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.settings.soon'),
            description: strings('modal.settings.soonDescription')
        })
    }

    /**
     * @param {string} currencyCode
     * @param {integer} isHidden
     */
    toggleCurrencyVisibility = async (currencyCode, isHidden) => {
        currencyActions.toggleCurrencyVisibility(currencyCode, isHidden)
        const currencies = await setCurrencies()

        this.setAvailableCurrencies(currencies)
    }

    renderControlButton = (currency) => {

        if(currency.is_hidden === null) {
            return (
                <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                    <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={() => { this.handleAddCurrency(currency) }}>
                        <Text style={[styles.btn__text, styles.btn__text_add]}>
                            { strings('assets.addAsset') }
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        } else if(currency.is_hidden){
            return (
                <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                    <TouchableOpacity style={styles.btn} onPress={() => { this.toggleCurrencyVisibility(currency.currencyCode, +currency.is_hidden) }}>
                        <Text style={[styles.btn__text, styles.btn__text_disabled]}>
                            { strings('assets.showAsset') }
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        } else if(!currency.is_hidden) {
            return (
                <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                    <TouchableOpacity style={[styles.btn]} onPress={() => { this.toggleCurrencyVisibility(currency.currencyCode, +currency.is_hidden) }}>
                        <Text style={[styles.btn__text]}>
                            { strings('assets.hideAsset') }
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        }
    }

    handleOnLayout = (event) => {
        this.state.initSize = this.state.initSize < event.nativeEvent.layout.width ? event.nativeEvent.layout.width: this.state.initSize
    }

    render() {
        firebase.analytics().setCurrentScreen('AddAssetScreen.index')

        const { availableCurrencies } = this.state

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={ strings('assets.mainTitle') }
                />
                <View style={styles.wrapper__content}>
                    <View>
                        <TouchableOpacity style={styles.addButton} onPress={() => this.handleModal()}>
                            <Text style={styles.addButton__text}>
                                { strings('assets.addCustomAsset') }
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        <View style={styles.content__left}>
                            <View style={styles.content__left__bg} />
                            <ScrollView
                                style={styles.availableCurrencies}
                                showsVerticalScrollIndicator={false}>
                                {
                                    availableCurrencies.map((item, index) => {
                                        return (
                                            <View key={index}>
                                                <View
                                                    key={index}
                                                    style={styles.availableCurrencies__item}>
                                                    <CurrencyIcon currencyCode={item.currencyCode}
                                                                  markStyle={{ top: 30 }}/>
                                                    <View style={styles.availableCurrencies__text}>
                                                        <Text style={styles.availableCurrencies__text_name} numberOfLines={1}>{ item.currencyName }</Text>
                                                        <Text style={styles.availableCurrencies__text_symbol}>{ item.currencySymbol }</Text>
                                                    </View>
                                                    {
                                                        this.renderControlButton(item)
                                                    }
                                                </View>
                                                <View style={styles.availableCurrencies__line} />
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
        mainStore: state.mainStore
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
        marginTop: 100,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
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
        height: 1000,

    },
    content__right: {

    },
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
        marginLeft: 15,
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

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
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
        color: '#864dd9',
    },
    btn__text_disabled: {
        color: '#404040',
    },
    btn__text_add: {
        color: '#f4f4f4',
        backgroundColor: '#864dd9'
        // color: '#7127ac',
    }
}
