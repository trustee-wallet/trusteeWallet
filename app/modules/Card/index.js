/**
 * @version 0.11
 */
import React, { Component } from 'react'
import {
    Text,
    ScrollView,
    View,
    Platform,
    TouchableOpacity,
    Dimensions,
    Keyboard
} from 'react-native'



import { CardIOModule, CardIOUtilities } from 'react-native-awesome-card-io'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import { TextInputMask } from 'react-native-masked-text'

import valid from 'card-validator'
import _ from 'lodash'

import Icon from 'react-native-vector-icons/FontAwesome'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'

import CardNameInput from '../../components/elements/Input'
import GradientView from '../../components/elements/GradientView'
import Navigation from '../../components/navigation/Navigation'
import TextView from '../../components/elements/Text'
import Button from '../../components/elements/Button'
import NavStore from '../../components/navigation/NavStore'

import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import { setCards } from '../../appstores/Stores/Card/CardActions'
import cardDS from '../../appstores/DataSource/Card/Card'

import { renderError } from '../../services/utils'
import Validator from '../../services/UI/Validator/Validator'
import i18n, { strings } from '../../services/i18n'

import countriesDict from '../../assets/jsons/other/country-codes'

import Log from '../../services/Log/Log'
import { connect } from 'react-redux'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'
import { Cards } from '../../services/Cards/Cards'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'

const { height: HEIGHT } = Dimensions.get('window')

const CACHE_COUNTRIES = {}
let CACHE_TURN_ON = false
let CACHE_COUNTRIES_LENGTH = 0

class Card extends Component {

    constructor() {
        super()
        this.state = {
            number: '',
            numberPlaceholderPattern: '',
            numberPlaceholder: '',
            datePlaceholder: '0000',
            date: '',
            type: '',
            errors: [],
            focused: false,

            selectedCountry: '',
            selectCountriesList: [],

            show: false
        }
        this.cardNameInput = React.createRef()
    }

    async init() {

        CACHE_TURN_ON = await BlocksoftExternalSettings.get('cardsCountries', 'Cards/index' )
        for (const item of countriesDict) {
            CACHE_COUNTRIES[item.iso] = item
            CACHE_COUNTRIES_LENGTH++
        }
        const selectCountriesList = this._getSelectedCoutriesList()

        this.setState({
            selectCountriesList
        })

        if (Platform.OS === 'ios') {
            CardIOUtilities.preload()
        }

    }

    _getSelectedCoutriesList() {

        const selectCountriesList = []
        let skipped = false
        for (const item of countriesDict) {
            if (CACHE_TURN_ON !== 'ALL' && typeof CACHE_TURN_ON[item.iso] === 'undefined') {
                skipped = true
                continue
            }
            selectCountriesList.push({ key: item.iso, value: item.country })
        }

        if (skipped) {
            selectCountriesList.unshift({key : '', value: '-----'})
            selectCountriesList.push({key : '', value: '-----'})
            for (const item of countriesDict) {
                if (CACHE_TURN_ON !== 'ALL' && typeof CACHE_TURN_ON[item.iso] === 'undefined') {
                    selectCountriesList.push({ key: item.iso, value: item.country })
                }
            }
        }
        return selectCountriesList
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

                expiryMonth = expiryMonth.length === 1 ? '0' + expiryMonth : expiryMonth

                expiryYear = expiryYear.toString()

                const date = expiryMonth + expiryYear === '000' ? '' : expiryMonth + '/' + expiryYear.slice(expiryYear.length - 2, expiryYear.length)

                self.setState({
                    date
                })

                self.handleNumberInput({ value: date, name: 'date' })

            })
            .catch(() => {
            })
    }

    handleAdd = async () => {

        let { number, selectedCountry, date } = this.state


        const arrayToValidate = [
            {
                id: 'number',
                name: 'сard number',
                type: 'CARD_NUMBER',
                value: number
            }
        ]

        date ? arrayToValidate.push({
            id: 'date',
            name: 'expiration date',
            type: 'EXPIRATION_DATE',
            value: date
        }) : date = '00/00'

        const validate = await Validator.arrayValidation(arrayToValidate)

        this.setState({
            errors: validate.errorArr
        })

        const cardName = await this.cardNameInput.handleValidate()

        if (selectedCountry === '' || typeof CACHE_COUNTRIES[selectedCountry.key] === 'undefined') return

        const countryNativeCurrency = CACHE_COUNTRIES[selectedCountry.key]

        if (validate.status === 'success') {

            Keyboard.dismiss()

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
                    country_code: selectedCountry.key,
                    card_name: cardName.value,
                    currency: countryNativeCurrency.currencyCode
                }]
            })

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

        tmpErrors = _.remove(tmpErrors, obj => obj.field != name)

        const numberValidation = valid.number(value)

        if (name === 'number') {
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
                numberPlaceholder: value.replace(' ', '')
            })

            if ((value.replace(/\s+/g, '')).length === 16) {
                const validate = await Validator.arrayValidation([
                    {
                        id: 'number',
                        name: 'сard number',
                        type: 'CARD_NUMBER',
                        value
                    }
                ])

                if (validate.status === 'success') {
                    const countryCode = await Cards.getCountryCode(value)

                    const country = countriesDict.find(item => item.iso === countryCode)

                    if (typeof countryCode !== 'undefined' && typeof country !== 'undefined') {
                        this.setState({
                            selectedCountry: {
                                key: countryCode,
                                value: country.country
                            }
                        })
                    } else {
                        this.setState({ selectedCountry: { key: '804', value: 'Ukraine' } })
                    }
                }
            }
        } else if (name === 'date') {
            this.setState({
                datePlaceholder: ((value.replace(' ', '')).concat('00000000')).substring(0, 5)
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
            } catch (e) {
            }
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
                    {strings('card.numberTitleInput')}
                </Text>
                {
                    this.state.show ? <TextInputMask
                        type={'custom'}
                        keyboardType={'numeric'}
                        selectionColor={'#fff'}
                        options={{
                            mask: '9999 9999 9999 9999 9999'
                        }}
                        value={this.state.numberPlaceholder}
                        style={[styles.card__number, styles.card__number_placeholder, { color: renderError('number', errors) ? '#e77ca3' : '#f4f4f4' }]}
                    /> : null
                }
                {
                    this.state.show ? <TextInputMask
                        type={'custom'}
                        keyboardType={'numeric'}
                        selectionColor={'#fff'}
                        options={{
                            mask: '9999 9999 9999 9999 9999'
                        }}
                        value={this.state.numberPlaceholder}
                        style={{ ...styles.card__number, ...styles.card__number_shadow }}
                    /> : null
                }
                {
                    this.state.show ? <TextInputMask
                        selectionColor={'#fff'}
                        type={'custom'}
                        keyboardType={'numeric'}
                        options={{
                            mask: '9999 9999 9999 9999 9999'
                        }}
                        value={number}
                        style={{ ...styles.card__number }}
                    /> : null
                }
                {
                    this.state.show ? <TextInputMask
                        selectionColor={'#fff'}
                        type={'custom'}
                        keyboardType={'numeric'}
                        options={{
                            mask: '9999 9999 9999 9999 9999'
                        }}
                        onFocus={() => this.onFocus()}
                        autoFocus={true}
                        placeholder={strings('card.dateTitleInput')}
                        placeholderTextColor={renderError('number', errors) ? 'transparent' : 'transparent'}
                        value={number}
                        // editable={false}
                        onChangeText={value => this.handleNumberInput({ value, name: 'number' })}
                        style={{ ...styles.card__number, ...styles.card__number_transparent }}
                    /> : null
                }
                <View style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 0,
                    height: 1,
                    width: '100%',
                    backgroundColor: '#f4f4f4'
                }}/>
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
                    {strings('card.dateTitleInput')}
                </Text>
                <TextInputMask
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    value={this.state.datePlaceholder}
                    style={[styles.card__date, styles.card__date_placeholder, { color: renderError('date', errors) ? '#e77ca3' : '#f4f4f4' }]}
                />
                <TextInputMask
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    value={date}
                    style={{ ...styles.card__date, color: renderError('date', errors) ? '#e77ca3' : '#f4f4f4' }}
                />
                <TextInputMask
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    value={this.state.datePlaceholder}
                    style={{ ...styles.card__date, ...styles.card__date_shadow }}
                />
                <TextInputMask
                    keyboardType={'numeric'}
                    type={'datetime'}
                    options={{
                        format: 'MM/YY'
                    }}
                    placeholder={strings('card.dateTitleInput')}
                    placeholderTextColor={renderError('date', errors) ? 'transparent' : 'transparent'}
                    value={date}
                    // editable={false}
                    onChangeText={value => this.handleNumberInput({ value, name: 'date' })}
                    style={{ ...styles.card__date, ...styles.card__date_transparent }}
                />
            </View>
        )
    }

    handleCountrySelect = () => {
        if (CACHE_COUNTRIES_LENGTH === 0) {
            this.init()
        }
        let selectCountriesList = this.state.selectCountriesList
        if (this.state.selectCountriesList.length === 0) {
            selectCountriesList = this._getSelectedCoutriesList()
        }

        showModal({
            type: 'SELECT_MODAL',
            data: {
                title: strings('card.cardCurrency').replace(/\./g, ''),
                listForSelect: selectCountriesList,
                selectedItem: this.state.selectedCountry
            }
        }, (selectedCountry) => {
            this.setState({ selectedCountry })
        })
    }

    render() {
        if (CACHE_COUNTRIES_LENGTH === 0) {
            this.init()
        }

        UpdateOneByOneDaemon.pause()
        MarketingAnalytics.setCurrentScreen('Card.index')

        const {
            focused,
            selectedCountry
        } = this.state

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={strings('card.title')}
                />
                <KeyboardAwareView>
                    <View style={{ flex: 1 }}>
                        <ScrollView
                            ref={(ref) => {
                                this.scrollView = ref
                            }}
                            keyboardShouldPersistTaps={'always'}
                            contentContainerStyle={focused ? styles.wrapper__content_active : styles.wrapper__content}
                            showsVerticalScrollIndicator={false}
                            style={styles.wrapper__scrollView}>
                            <TextView style={{ height: 70 }}>
                                {strings('card.description')}
                            </TextView>
                            <View style={styles.card}>
                                <GradientView style={styles.card__bg} array={card__bg.array} start={card__bg.start}
                                              end={card__bg.end}/>
                                <View style={styles.card__icon}>
                                    {
                                        this.state.type != '' ?
                                            <Icon style={styles.actionBtn__icon}
                                                  name={this.state.type == 'visa' ? 'cc-visa' : 'cc-mastercard'}
                                                  size={25} color="#fff"/> : null
                                    }
                                </View>
                                <View style={styles.card__content}>
                                    {this.renderNumberInput()}
                                    {this.renderDateInput()}
                                </View>
                                <View style={styles.card__press}>
                                    <TouchableOpacity
                                        style={styles.card__press__bg}
                                        onPress={this.handleScan}>
                                        <MaterialCommunityIcons style={styles.actionBtn__icon}
                                                                name={'credit-card-scan'} size={24} color="#7127ac"/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.select} onPress={() => this.handleCountrySelect()}>
                                <GradientView style={styles.select__bg} array={lineStyles_.array}
                                              start={lineStyles_.start} end={lineStyles_.end}>
                                    <Text style={styles.select__text}>
                                        {
                                            selectedCountry === '' ? strings('card.cardCurrency') : strings('card.country') + ' ' + selectedCountry.value
                                        }
                                    </Text>
                                    <View style={{ marginTop: 2 }}>
                                        <Ionicons name="ios-arrow-down" size={20} color="#fff"/>
                                    </View>
                                </GradientView>
                            </TouchableOpacity>
                            {/*<Picker ref={ref => this.currenciesPicker = ref}*/}
                            {/*        items={countriesList}*/}
                            {/*        placeholder={strings('card.cardCurrency')} />*/}

                            {/*<CardNumberInput*/}
                            {/*    ref={component => this.cardNameInput = component}*/}
                            {/*    id={'cardNumberInput'}*/}
                            {/*    name={strings('card.numberTitleInput')}*/}
                            {/*    style={{ marginRight: 2, marginTop: 10 }}*/}
                            {/*    onChange={value => this.handleNumberInput({ value, name: 'number' }) }*/}
                            {/*    keyboardType={'numeric'}*/}
                            {/*    additional={'NUMBER'}*/}
                            {/*    callback={(value) => { this.handleNumberInput({ value, name: 'number' }) }}/>*/}
                            {/*<CardDateInput*/}
                            {/*    ref={component => this.cardNameInput = component}*/}
                            {/*    id={'cardDate'}*/}
                            {/*    name={strings('card.dateTitleInput')}*/}
                            {/*    type={'OPTIONAL'}*/}
                            {/*    additional={'NUMBER'}*/}
                            {/*    style={{ marginRight: 2 }}*/}
                            {/*    onChange={(value) => { this.handleNumberInput({ value, name: 'date' }) }}/>*/}
                            <CardNameInput
                                ref={component => this.cardNameInput = component}
                                id={'cardName'}
                                name={strings('card.cardName')}
                                type={'OPTIONAL'}
                                style={{ marginRight: 2 }}/>
                            {/*<WarningText style={styles.warningText}>*/}
                            {/*    { strings('card.attention') }*/}
                            {/*</WarningText>*/}
                            <View style={{ ...styles.card__btn }}>
                                <Button
                                    onPress={() => this.handleAdd()}>
                                    {strings('card.add')}
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

const lineStyles_ = {
    array: ['#864dd9', '#ce53f9'],
    arrayError: ['#e77ca3', '#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles_ = {
    array: ['#fff', '#F8FCFF'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const card__bg = {
    array: ['#864dd9', '#ce53f9'],
    arrayError: ['#e77ca3', '#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = {
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80
    },
    wrapper_gradient: {
        array: ['#fff', '#F8FCFF'],
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
        textAlign: 'center'
    },
    card: {
        position: 'relative',
        width: '100%',
        height: 180,

        marginBottom: 20,
        marginTop: 20,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
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
        width: '90%',
        height: 80,

        overflow: 'hidden'
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

        zIndex: 2
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
        fontFamily: 'SFUIDisplay-Regular'
    },
    card__title_number: {
        top: 14
    },
    card__title_date: {
        top: 6
    },
    card__btn: {
        marginTop: 'auto',
        marginBottom: 20
    },
    warningText: {
        width: '100%',
        marginTop: -10
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 10
    },
    card__press__bg: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 44,
        backgroundColor: '#fff'
    },
    select: {
        height: 36,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,

        backgroundColor: '#fff',
        borderRadius: 10
    },
    select__bg: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        height: '100%',
        paddingHorizontal: 12,

        borderRadius: 10
    },
    select__text: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular'
    }
}
