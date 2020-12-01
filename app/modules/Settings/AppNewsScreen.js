/**
* @version 0.10
*/
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dimensions, View, Text, ScrollView, TouchableOpacity, Platform, Image, PixelRatio } from 'react-native'
import Entypo from 'react-native-vector-icons/Entypo'

import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'

import firebase from 'react-native-firebase'

import { strings, sublocale } from '../../services/i18n'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import AppNewsActions from '../../appstores/Stores/AppNews/AppNewsActions'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'


const { height: WINDOW_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 16
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 8
}

class AppNewsScreen extends Component {

    async clearAllHandle() {
        return AppNewsActions.clearAll()
    }

    render() {
        const appNewsList = this.props.appNewsList

        firebase.analytics().setCurrentScreen('AppNewsScreen')

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('appNews.title')}
                    navigation={this.props.navigation}
                />
                <View style={styles.wrapper__content}>
                    <ScrollView>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TouchableOpacity style={styles.title}>
                                <Text>
                                    {SIZE === 8 ? strings('appNews.subtitleSmall') : strings('appNews.subtitle')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addAsset} onPress={() => this.clearAllHandle()}>
                                <View style={styles.addAsset__content}>
                                    <Entypo style={styles.addAsset__icon} size={13} name="trash"/>
                                    <Text style={styles.addAsset__text}>
                                        {strings('appNews.clearAll')}
                                    </Text>
                                    <Image
                                        style={[styles.img__hor, styles.img__hor_right]}
                                        resizeMode={'stretch'}
                                        source={styles.img__paths.right}
                                    />
                                    <Image
                                        style={[styles.img__hor, styles.img__hor_left]}
                                        resizeMode={'stretch'}
                                        source={styles.img__paths.left}
                                    />
                                    <Image
                                        style={[styles.img__ver]}
                                        resizeMode={'stretch'}
                                        source={styles.img__paths.line}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                        {
                            appNewsList.length ? appNewsList.map((item, index) => {

                                let title = item.newsCustomTitle
                                let description = item.newsCustomText
                                const data = {currencyCode : item.currencyCode, walletName : item.walletName, ... item.newsJson}
                                const currency = BlocksoftDict.getCurrencyAllSettings(item.currencyCode)
                                if (currency) {
                                    data.currencySymbol = currency.currencySymbol
                                    data.currencyName = currency.currencyName
                                } else {
                                    data.currencySymbol = ''
                                    data.currencyName = ''
                                }

                                data.amountPretty = ''
                                if (typeof data.addressAmount !== 'undefined') {
                                    const tmp = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makePretty(data.addressAmount, 'appNewsScreen.addressAmount')
                                    data.amountPretty = BlocksoftPrettyNumbers.makeCut(tmp).separated
                                } else if (typeof data.balance !== 'undefined') {
                                    const tmp = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makePretty(data.balance, 'appNewsScreen.balance')
                                    data.amountPretty = BlocksoftPrettyNumbers.makeCut(tmp).separated
                                }
                                if (!title) {
                                    title = strings('pushNotifications.' + item.newsName + '.title', data)
                                }
                                if (!description) {
                                    description = strings('pushNotifications.' + item.newsName + '.description', data)
                                }
                                return (
                                    <View style={styles.container} key={index}>
                                        <View style={{ position: 'relative' }}>
                                            <View style={{
                                                position: 'relative',

                                                marginBottom: 15,
                                                marginTop: 5,
                                                marginLeft: 16,
                                                marginRight: 16,
                                                backgroundColor: '#fff',
                                                borderRadius: 16,

                                                zIndex: 2
                                            }}>
                                                <TouchableOpacity style={styles.cryptoList__item}>
                                                    <GradientView
                                                        style={styles.cryptoList__item__content}
                                                        array={styles_.cryptoList__item.array}
                                                        start={styles_.cryptoList__item.start}
                                                        end={styles_.cryptoList__item.end}>

                                                        <View style={styles.cryptoList__info}>
                                                            <Text style={styles.cryptoList__title}>
                                                                {title}
                                                            </Text>
                                                            <Text style={styles.cryptoList__text}>
                                                                {new Date(item.newsCreated * 1000).toLocaleTimeString() + ' ' + new Date(item.newsCreated * 1000).toLocaleDateString()} : {description}
                                                            </Text>
                                                        </View>
                                                    </GradientView>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.shadow}>
                                                <View style={styles.shadow__item}/>
                                            </View>
                                        </View>
                                    </View>
                                )
                            }) : <Text style={{ marginLeft: 30 }}>{strings('appNews.newsNull')}</Text>
                        }
                    </ScrollView>
                </View>
            </View>
        )
    }
}

const styles_ = {
    cryptoList__icoWrap_bitcoin: {
        array: ['#e67947', '#f9f871'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__icoWrap_eth: {
        array: ['#145de3', '#4ec8f7'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__icoWrap_omni: {
        array: ['#3ac058', '#27e3ae']
    },
    cryptoList__ico: {
        color: '#FBFFFF',
        size: 24
    },
    cryptoList__item: {
        array: ['#fff', '#f4f4f4'],
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    bg: {
        array: ['#fff', '#F8FCFF'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 0, y: 1 }
    }
}

const mapStateToProps = (state) => {
    return {
        appNewsList: state.appNewsStore.appNewsList
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppNewsScreen)

const styles = {
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT,
        backgroundColor: '#f4f4f4'
    },
    wrapper__content: {
        flex: 1,

        position: 'relative',

        marginTop: 80,
        backgroundColor: '#f4f4f4'
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        width: '100%',
        paddingHorizontal: 15
    },
    title: {
        marginVertical: 20,
        marginBottom: 15,

        marginLeft: 31,
        fontFamily: 'Montserrat-Bold',
        color: '#404040',
        fontSize: 14
    },
    newOrder: {
        alignItems: 'center',
        justifyContent: 'center',

        height: 50,
        marginVertical: 20,

        borderRadius: 10,

        borderColor: '#404040',
        borderStyle: 'dashed',
        borderWidth: 1
    },
    cryptoList__item: {

        justifyContent: 'center',
        height: 80,
        borderRadius: 16,
        shadowColor: '#000'
    },
    cryptoList__item__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,

        backgroundColor: '#fff'
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        paddingLeft: 15,

        borderRadius: 16
    },
    cryptoList__title: {
        marginVertical: 5,

        color: '#404040',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14
    },
    cryptoList__text: {
        color: '#999999',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular'
    },
    cryptoList__info: {
        flex: 1
    },
    cryptoList__icoWrap: {
        width: 42,
        height: 42,
        marginRight: 15,
        elevation: 0,
        shadowColor: '#fff'
    },
    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 5
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        zIndex: 1
    },
    shadow__item: {

        marginHorizontal: 20,
        marginTop: 32,
        height: Platform.OS === 'ios' ? 50 : 52,

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    },
    img__paths: {
        left: require('../../assets/images/addAssetborderShadowLeft.png'),
        right: require('../../assets/images/addAssetborderShadowRight.png'),
        line: require('../../assets/images/addAssetborderShadowLines.png')
    },
    img__ver: {
        flex: 1,

        position: 'absolute',
        top: -6,
        left: 5,

        width: '103%',
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor: {
        flex: 1,

        position: 'absolute',
        top: -6,

        width: 10,
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor_right: {
        right: -5
    },
    img__hor_left: {
        left: -5
    },
    addAsset: {
        paddingVertical: 19,
        paddingHorizontal: 15
    },
    addAsset__content: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderColor: '#864DD9',
        borderWidth: 1.5
    },
    addAsset__text: {
        fontSize: 10,
        color: '#864DD9',
        fontFamily: 'Montserrat-Bold'
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,

        color: '#864DD9'
    }
}
