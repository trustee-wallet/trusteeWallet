import React, { Component } from 'react'
import {
    Text,
    ScrollView,
    View,
    Platform,
    TouchableOpacity,
    Dimensions
} from 'react-native'

import { CardIOModule, CardIOUtilities } from 'react-native-awesome-card-io'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import { TextInputMask } from 'react-native-masked-text'

import valid from 'card-validator'
import _ from 'lodash'
import axios from 'axios'

import Icon from 'react-native-vector-icons/FontAwesome'

import CardNameInput from '../../components/elements/Input'
import GradientView from '../../components/elements/GradientView'
import Navigation from '../../components/navigation/Navigation'
import TextView from '../../components/elements/Text'
import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'
import Picker from '../../components/elements/Picker'

import { setCards, setLoaderStatus } from '../../appstores/Actions/MainStoreActions'
import cardDS from '../../appstores/DataSource/Card/Card'

import { renderError } from '../../services/utils'
import validator from '../../services/validator/validator'
import i18n, { strings } from '../../services/i18n'

import countries from '../../assets/jsons/other/country-codes'
import currenciesDict from '../../assets/jsons/other/country-by-currency-code'

import Log from '../../services/Log/Log'
import { connect } from 'react-redux'
import firebase from "react-native-firebase"

const { height: HEIGHT } = Dimensions.get('window')


class Card extends Component {

    constructor(){
        super()
        this.state = {
            number: '',
            numberPlaceholderPattern: '0000000000000000',
            numberPlaceholder: '0000-0000-0000-0000',
            datePlaceholder: '0000',
            date: '',
            type: '',
            errors: [],
            focused: false,

            countryCode: '',

            countriesList: [],

            show: false
        }
        this.cardNameInput = React.createRef()
    }

    componentWillMount() {

        const { fiatRates } = this.props.fiatRatesStore

        let currencies = []

        fiatRates.forEach(item1 => currenciesDict.forEach(item2 => {
            if(item1.cc === item2.currencyCode) currencies.push(item2)
        }))

        const array = ['GBP','CHF','RUB','UAH','EUR','USD']

        for(const item of array){
            const currencyIndex = currencies.findIndex(currency => currency.currencyCode === item)
            currencies.unshift( currencies.splice( currencyIndex, 1 )[0] )
        }

        const countriesList = currencies.map(item => {
            return { label: item.currencyCode, value: item.currencyCode, color: '#404040'}
        })

        this.setState({
            countriesList
        })


        if (Platform.OS === 'ios') {
            CardIOUtilities.preload()
        }
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({
                show: true
            })
        }, 50)
    }

    handleScan = () => {

        let self = this

        CardIOModule
            .scanCard({
                suppressConfirmation: true,
                suppressManualEntry: true,
                scanInstructions: strings('card.instructions'),
                languageOrLocale: i18n.locale.split('-')[0] === 'uk' ? 'ru' : i18n.locale,
                requireCVV: false,
                hideCardIOLogo: true
            })
            .then(card => {

                let { cardNumber, expiryMonth, expiryYear } = card

                self.handleNumberInput({ value: cardNumber, name: 'number' })

                expiryMonth = expiryMonth.toString()

                expiryMonth = expiryMonth.length == 1 ? '0' + expiryMonth : expiryMonth

                expiryYear = expiryYear.toString()

                const date = expiryMonth + expiryYear == '000' ? '' : expiryMonth + '/' + expiryYear.slice(expiryYear.length - 2, expiryYear.length)

                self.setState({
                    date
                })

                self.handleNumberInput({ value: date, name: 'date' })

            })
            .catch(() => {
            })
    }

    getCountryCode = async (cardNumber) => {
        try {
            cardNumber = cardNumber.split(' ').join('')

            const res = await axios.get('https://lookup.binlist.net/' + cardNumber)

            return res.data.country.numeric
        } catch (e) {
            Log.err('Card.getCurrencyCode error', e)
        }

        return false
    }

    handleAdd = async () => {

        const { number, countryCode, date } = this.state

        let validate = await validator.arrayValidation([
            {
                id: 'number',
                name: 'сard number',
                type: 'CARD_NUMBER',
                value: number
            },
            {
                id: 'date',
                name: 'expiration date',
                type: 'EXPIRATION_DATE',
                value: date
            }
        ])

        const cardName = await this.cardNameInput.handleValidate()

        let cardCurrency = this.currenciesPicker.getSelected()
        const countryNativeCurrency = countries.find(item => item.iso === countryCode)
        cardCurrency === '' ? cardCurrency = countryNativeCurrency.currencyCode : cardCurrency


        if(validate.status === 'success'){

            this.setState({
                errors: [],
                focused: true
            })

            setLoaderStatus(true)

            await cardDS.saveCard({
                insertObjs: [{
                    number: number.replace(/\s+/g, ''),
                    expiration_date: date,
                    type: this.state.type,
                    country_code: countryCode,
                    card_name: cardName.value,
                    currency: cardCurrency
                }]
            })

            const { array: cards } = await cardDS.getCards()

            cards.unshift({
                name: 'Add new card',
                type: 'ADD'
            })

            // showModal({
            //     type: 'INFO_MODAL',
            //     icon: true,
            //     title: strings('modal.card.success'),
            //     description: strings('modal.card.added')
            // }, () => {
            //     NavStore.goNext('MainDataScreen')
            //
            // })

            await setCards()

            setLoaderStatus(false)

            NavStore.goNext('MainDataScreen')

        } else {
            this.setState({
                errors: validate.errorArr
            })
        }
    }

    handleNumberInput = async (data) => {

        const { errors } = this.state
        const { value, name } = data

        let tmpErrors = JSON.parse(JSON.stringify(errors))

        tmpErrors = _.remove(tmpErrors, obj =>  obj.field != name )

        let numberValidation = valid.number(value)

        if(name == 'number'){
            if (numberValidation.card) {
                this.setState({
                    type: numberValidation.card.type
                })
            } else {
                this.setState({
                    type: ''
                })
            }

            this.setState({
                numberPlaceholder: ((value.replace(' ', '')).concat(this.state.numberPlaceholderPattern)).substring(0, 20)
            })

            if((value.replace(/\s+/g, '')).length === 16){
                const validate = await validator.arrayValidation([
                    {
                        id: 'number',
                        name: 'сard number',
                        type: 'CARD_NUMBER',
                        value
                    }
                ])

                if(validate.status === 'success'){
                    const countryCode = await this.getCountryCode(value)

                    this.setState({
                        countryCode
                    })

                    const countryNativeCurrency = countries.find(item => item.iso === countryCode)

                    if(typeof countryNativeCurrency != 'undefined') this.currenciesPicker.setSelected(countryNativeCurrency.currencyCode)
                }
            }
        }

        if(name == 'date'){
            this.setState({
                datePlaceholder: ((value.replace(' ', '')).concat(this.state.numberPlaceholderPattern)).substring(0, 5)
            })
        }

        this.setState({
            [name]: value,
            errors: tmpErrors
        })

    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 100 })
            } catch (e) {}
        }, 500)
    }

    renderNumberInput = () => {

        const {
            number,
            errors
        } = this.state

        return (
            <View style={styles.card__item}>
                <Text style={[styles.card__title, styles.card__title_number]}>
                    { strings('card.numberTitleInput') }
                </Text>
                {
                    this.state.show ? <TextInputMask
                        type={'credit-card'}
                        options={{
                            obfuscated: false,
                            issuer: 'visa-or-mastercard'
                        }}
                        placeholderTextColor={renderError('number', errors) ? '#e77ca3' : '#f4f4f4'}
                        value={this.state.numberPlaceholder}
                        style={[styles.card__number, styles.card__number_placeholder]}
                    /> : null
                }
                {
                    this.state.show ? <TextInputMask
                        type={'credit-card'}
                        options={{
                            obfuscated: false,
                            issuer: 'visa-or-mastercard'
                        }}
                        value={this.state.numberPlaceholder}
                        style={{...styles.card__number, ...styles.card__number_shadow}}
                    /> : null
                }
                {
                    this.state.show ? <TextInputMask
                        type={'credit-card'}
                        options={{
                            obfuscated: false,
                            issuer: 'visa-or-mastercard'
                        }}
                        placeholderTextColor={renderError('number', errors) ? '#e77ca3' : '#f4f4f4'}
                        value={number}
                        style={{...styles.card__number, color: renderError('number', errors) ? '#e77ca3' : '#f4f4f4' }}
                    /> : null
                }
                {
                    this.state.show ? <TextInputMask
                        type={'credit-card'}
                        options={{
                            obfuscated: false,
                            issuer: 'visa-or-mastercard'
                        }}
                        onFocus={ () => this.onFocus() }
                        autoFocus={true}
                        placeholderTextColor={renderError('number', errors) ? 'transparent' : 'transparent'}
                        value={number}
                        onChangeText={value => this.handleNumberInput({ value, name: 'number' }) }
                        style={{...styles.card__number, ...styles.card__number_transparent}}
                    /> : null
                }
            </View>
        )
    }

    renderDateInput = () => {

        const {
            date,
            errors
        } = this.state

        return (
            <View style={styles.card__item}>
                <Text style={[styles.card__title, styles.card__title_date]}>
                    { strings('card.dateTitleInput') }
                </Text>
                <TextInputMask
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    value={this.state.datePlaceholder}
                    style={[styles.card__date, styles.card__date_placeholder]}
                />
                <TextInputMask
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    placeholderTextColor={renderError('date', errors) ? '#e77ca3' : '#f4f4f4'}
                    value={date}
                    style={{...styles.card__date, color: renderError('date', errors) ? '#e77ca3' : '#f4f4f4' }}
                />
                <TextInputMask
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    value={this.state.datePlaceholder}
                    style={{...styles.card__date, ...styles.card__date_shadow}}
                />
                <TextInputMask
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    placeholderTextColor={renderError('date', errors) ? 'transparent' : 'transparent'}
                    value={date}
                    onChangeText={value => this.handleNumberInput({ value, name: 'date' }) }
                    style={{...styles.card__date, ...styles.card__date_transparent}}
                />
            </View>
        )
    }

    render() {
        firebase.analytics().setCurrentScreen('Card.index')

        const {
            focused,
            countriesList
        } = this.state

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={ strings('card.title') }
                />
                <KeyboardAwareView>
                    <View style={{flex: 1}}>
                        <ScrollView
                            ref={(ref) => { this.scrollView = ref }}
                            keyboardShouldPersistTaps
                            contentContainerStyle={focused ? styles.wrapper__content_active : styles.wrapper__content}
                            showsVerticalScrollIndicator={false}
                            style={styles.wrapper__scrollView}>
                            <TextView style={{ height: 70 }}>
                                { strings('card.description') }
                            </TextView>
                            <View style={styles.card}>
                                <GradientView style={styles.card__bg} array={card__bg.array} start={card__bg.start} end={card__bg.end} />
                                <View style={styles.card__icon}>
                                    {
                                        this.state.type != '' ?
                                            <Icon style={styles.actionBtn__icon}
                                                  name={this.state.type == 'visa' ? 'cc-visa' : 'cc-mastercard'} size={25} color="#fff" /> : null
                                    }
                                </View>
                                <View style={styles.card__content}>
                                    { this.renderNumberInput() }
                                    { this.renderDateInput() }
                                </View>
                                <View style={styles.card__press}>
                                    <TouchableOpacity
                                        style={styles.card__press__bg}
                                        onPress={this.handleScan}>
                                        <Icon style={styles.actionBtn__icon}
                                              name={'camera'} size={17} color="#7127ac" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Picker ref={ref => this.currenciesPicker = ref}
                                    items={countriesList}
                                    placeholder={strings('card.cardCurrency')} />
                            <View style={{ marginTop: 10 }}>
                                <CardNameInput
                                    ref={component => this.cardNameInput = component}
                                    id={'cardName'}
                                    name={strings('card.cardName')}
                                    type={'OPTIONAL'}
                                    style={{ marginRight: 2 }}/>
                            </View>

                            {/*<WarningText style={styles.warningText}>*/}
                            {/*    { strings('card.attention') }*/}
                            {/*</WarningText>*/}
                            <View style={{...styles.card__btn, }}>
                                <Button
                                    onPress={() => this.handleAdd()}>
                                    { strings('card.add') }
                                </Button>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAwareView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        fiatRatesStore: state.fiatRatesStore
    }
}

export default connect(mapStateToProps, {})(Card)

const styles_ = {
    array: ["#fff","#F8FCFF"],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const card__bg = {
    array: ["#864dd9","#ce53f9"],
    arrayError: ['#e77ca3','#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = {
    wrapper: {
        flex: 1,
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    wrapper_gradient: {
        array: ["#fff","#F8FCFF"],
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    wrapper__content: {
        flex: 1,
        minHeight: HEIGHT - 100,
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    wrapper__content_active: {
        flex: 1,
        minHeight: 500,
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    title: {
        marginBottom: 10,
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center',
    },
    card: {
        position: 'relative',
        width: '100%',
        height: 180,

        marginBottom: 20,
        marginTop: 20,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
    },
    card__content: {
        position: 'relative',

        width: '100%',
        marginLeft: 15,

        zIndex: 2
    },
    card__item: {
        position: 'relative',
        top: 40,
        width: '100%',
        height: 80,
    },
    card__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: 10,

        zIndex: 1
    },
    card__name: {
        marginTop: 5,
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#f4f4f4'
    },
    card__number: {
        position: 'absolute',
        top: 10,
        left: 0,
        width: '100%',
        height: 70,
        fontSize: 18,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        color: 'transparent',
        zIndex: 3
    },
    card__number_placeholder: {
        position: 'absolute',
        top: 10,
        left: 0,
        width: '100%',

        color: '#e8e8e8',

        zIndex: 2,
    },
    card__number_shadow: {
        top: 12,

        color: '#000',
        zIndex: 1
    },
    card__number_transparent: {
        zIndex: 4
    },
    card__date: {
        position: 'absolute',
        top: 10,
        left: 0,
        width: '100%',
        height: 50,
        fontSize: 16,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        color: 'transparent',
        zIndex: 3
    },
    card__date_placeholder: {
        position: 'absolute',

        left: 0,
        top: 10,

        color: '#e8e8e8',
        zIndex: 2
    },
    card__date_shadow: {
        position: 'absolute',

        top: 12,
        left: 0,

        color: '#000',
        zIndex: 1
    },
    card__date_transparent: {
        zIndex: 4
    },
    card__icon: {
        position: 'absolute',
        right: 0,
        bottom: 10,
        alignSelf: 'flex-end',
        marginRight: 12,
        zIndex: 2
    },
    card__title: {
        position: 'absolute',
        left: Platform.OS === 'android' ? 5 : 2,
        fontSize: 10,
        color: '#f4f4f4',
        fontFamily: 'SFUIDisplay-Regular',
    },
    card__title_number: {
        top: 14,
    },
    card__title_date: {
        top: 6,
    },
    card__btn: {
        marginTop: 'auto',
        marginBottom: 20
    },
     warningText: {
        width: '100%',
        marginTop: -10,
     },
    card__press: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 44,
        height: 44,
        borderRadius: 44,
        backgroundColor: '#fff',
        zIndex: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 10,
    },
    card__press__bg: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 44,
        backgroundColor: '#fff',
    },

}
