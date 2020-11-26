/**
 * @version 0.9
 */
import React from 'react'
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native'

import {
    UIActivityIndicator,
    MaterialIndicator
} from 'react-native-indicators'

import { strings } from '../../../services/i18n'

import Card from 'react-native-vector-icons/FontAwesome'
import Entypo from 'react-native-vector-icons/Entypo'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'

import countriesDict from '../../../assets/jsons/other/country-codes'
import AntDesign from 'react-native-vector-icons/AntDesign'
import UpdateCardsDaemon from '../../../daemons/back/UpdateCardsDaemon'


export default new class Templates {
    addCardTemplate = ({ handleAddCard }) => {
        return (
            <View style={{ paddingLeft: 15, paddingTop: 15}}>
                <View style={styles.slide}>
                    <TouchableOpacity style={styles.slide__add} onPress={() => handleAddCard()}>
                        <View style={styles.slide__add__border}>
                            <Text style={styles.slide__add__title}>{strings('exchange.mainData.addCard')}</Text>
                            <Card style={styles.slide__add__icon} name="credit-card" size={20} color="#864dd9"/>
                        </View>
                    </TouchableOpacity>
                    <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 15, zIndex: 1 }}>
                        <View style={styles.slide__add__shadow}/>
                    </View>
                </View>
            </View>
        )
    }
    mainCardTemplate = ({ card, handleDeleteCard, validateCard, isPhotoValidation, photoValidationCurrencies }) => {

        let country = countriesDict.filter(item => item.iso === card.countryCode)
        country = country[0]

        // TODO: remove support cards for kazakhstan (#RESHENIE)

        const needValidation = photoValidationCurrencies.indexOf(country.currencyCode) !== -1 || card.countryCode === "398" || card.countryCode === "112"

        const cardJson = JSON.parse(card.cardVerificationJson)

        if (typeof cardJson !== 'undefined' && cardJson && typeof cardJson.verificationStatus !== 'undefined' && cardJson.verificationStatus.toLowerCase() === 'pending') {
            UpdateCardsDaemon.updateCardsDaemon({force : true, unique: card.id})
        }
        return (
            <View style={{ paddingLeft: 15, paddingTop: 15, position: 'relative'}}>
                {
                    isPhotoValidation && needValidation ?
                        <TouchableOpacity style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,

                            zIndex: 30
                        }} onPress={() => validateCard()} disabled={cardJson !== null && (cardJson.verificationStatus === 'pending' || cardJson.verificationStatus === 'success')}>
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',

                                width: 30,
                                height: 30,
                                margin: 15,

                                backgroundColor: '#fff',
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 0,
                                    height: 1
                                },
                                shadowOpacity: 0.20,
                                shadowRadius: 1.41,

                                elevation: 2,
                                borderBottomRightRadius: 10,
                                borderTopLeftRadius: 6,
                            }}>
                                { cardJson == null ? <MaterialIcons size={16} color="#7127ac" name="add-a-photo" /> : cardJson.verificationStatus === 'pending' && Platform.OS === 'ios' ? <UIActivityIndicator size={16} color='#7127ac' /> : cardJson.verificationStatus === 'pending' && Platform.OS === 'android' ? <MaterialIndicator size={16} color='#7127ac' /> : cardJson.verificationStatus === 'canceled' ? <AntDesign name="close" size={25} color={"#7127ac"} /> : <Ionicons size={25} color="#7127ac" name="ios-checkmark" /> }
                            </View>
                        </TouchableOpacity> : null
                }
                <View style={styles.slide}>
                    <Image
                        style={styles.slide__bg}
                        resizeMode='stretch'
                        source={require('../../../assets/images/cardVisa.png')}/>
                    {
                        !card.supported ?
                            <View style={styles.slide__blocked}>
                                <Text style={styles.slide__blocked__text}>
                                    { strings('exchange.mainData.blockedCard')}
                                </Text>
                            </View> : null
                    }
                    <TouchableOpacity
                        style={styles.slide__cross}
                        onPress={() => handleDeleteCard(card)}>
                        <Entypo style={styles.slide__add__icon} name="cross" size={20} color={card.supported ? '#f4f4f4' : '#404040'}/>
                    </TouchableOpacity>
                    <View style={styles.slide__content}>
                        <View style={styles.slide__top}>
                            <Text style={styles.slide__number__stars}>**** **** **** </Text>
                            <Text style={styles.slide__number__stars__shadow}>**** **** **** </Text>
                            <Text style={styles.slide__number}>{card.number.slice(card.number.length - 4, card.number.length)}</Text>
                            <Text style={styles.slide__number__shadow}>{card.number.slice(card.number.length - 4, card.number.length)}</Text>
                        </View>
                        <View style={styles.slide__bot}>
                            <View style={{ flex: 1, position: 'relative' }}>
                                <View>
                                    <Text style={styles.slide__expirationDate}>
                                        {card.expiration_date}
                                    </Text>
                                    <Text style={styles.slide__expirationDate__shadow}>
                                        {card.expiration_date}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.slide__card__name}>
                                        { card.cardName === null || card.cardName === '' ? (strings('card.noName')).toUpperCase() : (card.cardName).toUpperCase() } {'| ' + country.country }
                                    </Text>
                                    <Text style={styles.slide__card__name__shadow}>
                                        { card.cardName === null || card.cardName === '' ? (strings('card.noName')).toUpperCase() : (card.cardName).toUpperCase() } {'| ' + country.country }
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.slide__icon}>
                                {
                                    card.type != '' ?
                                        <Card style={styles.actionBtn__icon}
                                              name={card.type == 'visa' ? 'cc-visa' : 'cc-mastercard'} size={25} color="#fff"/> : null
                                }
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}

const styles = {
    slide: {
        position: 'relative',
        width: 210,
        height: 125,
        borderRadius: 15
    },
    slide__content: {
        position: 'relative',
        marginLeft: 15,
        zIndex: 2
    },
    slide__top: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        marginTop: 25
    },
    slide__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '94%',
        zIndex: 1
    },
    slide__blocked: {
        position: 'absolute',
        top: 0,
        left: 0,

        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        opacity: 0.9,
        zIndex: 5
    },
    slide__blocked__text: {
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 15,

        fontSize: 10,
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Bold',
        color: '#404040'
    },
    slide__blocked__icon: {
        position: 'absolute',
        top: 96
    },
    slide__name: {
        marginTop: 13,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#f4f4f4'
    },
    slide__number__stars: {
        position: 'relative',

        marginTop: 15,

        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 10,
        color: '#f4f4f4',
        zIndex: 2
    },
    slide__number__stars__shadow: {
        position: 'absolute',
        top: 22,
        left: 0,

        fontSize: 10,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        color: '#000',

        zIndex: 1
    },
    slide__number: {
        position: 'relative',

        marginTop: 20,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 14,
        color: '#f4f4f4',

        zIndex: 2
    },
    slide__number__shadow: {
        position: 'absolute',
        top: 2,
        right: 45,

        marginTop: 20,
        marginBottom: 25,
        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 14,
        color: '#000',

        zIndex: 1
    },
    slide__bot: {
        flexDirection: 'row',
        alignItems: 'center',

        position: 'relative',
        marginTop: 15,
    },
    slide__expirationDate: {
        position: 'relative',

        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 8,
        color: '#f4f4f4',

        zIndex: 2
    },
    slide__expirationDate__shadow: {
        position: 'absolute',
        top: 2,
        left: 0,

        fontFamily: Platform.OS === 'android' ? 'OCR A Std Regular' : 'OCR A Std',
        fontSize: 8,
        color: '#000',

        zIndex: 1
    },
    slide__card__name: {
        position: 'relative',

        marginTop: 5,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 8,
        color: '#fff',
        zIndex: 2
    },
    slide__card__name__shadow: {
        position: 'absolute',
        top: 2,

        marginTop: 5,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 8,
        color: '#000',

        zIndex: 1
    },
    slide__icon: {
        marginTop: -22,
        marginRight: 10,
        alignSelf: 'flex-end'
    },
    slide__add: {
        position: 'relative',
        flex: 1,
        padding: 6,
        marginBottom: 10,
        borderRadius: 14,
        zIndex: 2
    },
    slide__add__border: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        height: '94%',

        borderWidth: 1,
        borderColor: '#864dd9',
        borderStyle: 'dashed',
        borderRadius: 12,

        zIndex: 2
    },
    slide__add__title: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Bold',
        color: '#864dd9'
    },
    slide__add__shadow: {
        position: 'absolute',
        top: 3,
        left: 3,
        width: 204,
        height: 102,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,
        borderRadius: 14
    },
    slide__add__icon: {
        marginLeft: 10,
        marginBottom: 2
    },
    slide__cross: {
        position: 'absolute',
        top: -10,
        right: -10,
        padding: 16,
        zIndex: 10
    },
    paginationContainer: {
        paddingVertical: 20
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 8
    },
}
