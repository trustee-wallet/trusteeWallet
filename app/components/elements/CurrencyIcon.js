/**
 * @version 0.9
 * @misha to think about optimization
 */
import React, { Component } from 'react'

import { View, Text, Image, Platform } from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import CustomIcon from './CustomIcon'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import { ThemeContext } from '../../modules/theme/ThemeProvider'


export default class ButtonLine extends Component {

    renderIcon = () => {

        const { currencyCode, containerStyle, markStyle, iconStyle, textContainerStyle, textStyle } = this.props

        const fontSize = typeof iconStyle !== 'undefined' ? iconStyle.fontSize : 24

        const tmpContainerStyle = typeof containerStyle !== 'undefined' ? containerStyle : null

        const tmpMarkStyle = typeof markStyle !== 'undefined' ? markStyle : null

        let extend
        try {
            extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        } catch (e) {
            extend = 'NOCOIN'
        }

        const { colors } = this.context

        switch (currencyCode) {

            case 'ETH_UAX':
                return (
                    <View style={{ ...styles.icon, borderColor: '#2965FF', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('../../assets/images/ethUAX.png')}/>
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_OKB':
                return (
                    <View style={{ ...styles.icon, borderColor: '#3075EE', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('../../assets/images/ETH_OKB.png')}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )

            case 'XMR':
                return (
                    <View style={{ ...styles.icon, borderColor: '#F26822', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('../../assets/images/XMR.png')}/>
                        </View>
                    </View>
                )

            case 'ETH_ONE':
                return (
                    <View style={{ ...styles.icon, borderColor: '#35D4D3', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_ONE" style={{ color: '#35D4D3', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )

            case 'TRX_USDT':
                return (
                    <View style={{ ...styles.icon, borderColor: '#31D182', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: '#31D182', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name="TRX" style={{ color: '#E51A31' }} fontSize={13}/>
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case 'TRX_BTT':
                return (
                    <View style={{ ...styles.icon, borderColor: '#D73A64', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="TRX_BTT" style={{ color: '#D73A64', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name="TRX" style={{ color: '#E51A31' }} fontSize={13}/>
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case 'XVG':
                return (
                    <View style={{ ...styles.icon, borderColor: '#00CBFF', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="XVG" style={{ color: '#00CBFF', fontSize: fontSize }}/>
                        </View>
                    </View>
                )

            case 'DOGE':
                return (
                    <View style={{ ...styles.icon, borderColor: '#CEB55C', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="DOGE" style={{ color: '#CEB55C', fontSize: fontSize }}/>
                        </View>
                    </View>
                )

            case 'ETH_SOUL':
                return (
                    <View style={{ ...styles.icon, borderColor: '#A1B8CE', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: 25, height: 25 }} resize={'stretch'} source={require('../../assets/images/ethSOUL.png')}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            // case 'XMR':
            //     return (
            //         <View style={{ ...styles.icon, borderColor: '#E51A31', ...tmpContainerStyle }}>
            //             <View style={styles.icon__item}>
            //                 <CustomIcon name="XMR" style={{ color: '#E51A31', fontSize: fontSize }}/>
            //             </View>
            //         </View>
            //     )
            case 'TRX':
                return (
                    <View style={{ ...styles.icon, borderColor: '#E51A31', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="TRX" style={{ color: '#E51A31', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'LTC':
                return (
                    <View style={{ ...styles.icon, borderColor: '#60BBF5', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="LTC" style={{ color: '#60BBF5', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'ETH':
                return (
                    <View style={{ ...styles.icon, borderColor: '#1EB3E4', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Icon name="ethereum" size={fontSize} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )
            case 'ETH_ROPSTEN':
                return (
                    <View style={{ ...styles.icon, borderColor: '#68268C', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_ROPSTEN" size={fontSize} color={'#68268C'}/>
                        </View>
                    </View>
                )
            case 'BTC':
            case 'BTC_TEST':
                return (
                    <View style={{ ...styles.icon, borderColor: '#F79E1B', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BTC" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'BTC_SEGWIT':
                return (
                    <View style={{ ...styles.icon, borderColor: '#F79E1B', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BTC" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                            <View style={{ ...styles.icon__text, ...textContainerStyle }}>
                                <Text style={{ ...styles.icon__text__item, backgroundColor: colors.common.iconMarkBg, ...textStyle }}>
                                    SW
                                </Text>
                            </View>
                        </View>
                    </View>
                )
            case 'BTC_SEGWIT_COMPATIBLE':
                return (
                    <View style={{ ...styles.icon, borderColor: '#F79E1B', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BTC" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                            <View style={{ ...styles.icon__text, ...textContainerStyle }}>
                                <Text style={{ ...styles.icon__text__item, backgroundColor: colors.common.iconMarkBg, ...textStyle }}>
                                    SWC
                                </Text>
                            </View>
                        </View>
                    </View>
                )
            case 'BCH':
                return (
                    <View style={{ ...styles.icon, borderColor: '#F79E1B', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BCH" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'BTG':
                return (
                    <View style={{ ...styles.icon, borderColor: '#132365', borderWidth: 1, ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <View style={{ padding: 3, borderWidth: 5, borderColor: '#E1A600', borderRadius: 30 }}>
                                <View style={{ marginTop: Platform.OS === 'ios' ? -1 : 0 }}>
                                    <CustomIcon name="BTG" style={{ color: '#132365', fontSize: fontSize }}/>
                                </View>
                            </View>
                        </View>
                    </View>
                )
            case 'USDT':
                return (
                    <View style={{ ...styles.icon, borderColor: '#31D182', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: '#31D182', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="bitcoin" size={14} color={'#F79E1B'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_TRUE_USD':
                return (
                    <View style={{ ...styles.icon, borderColor: '#5BB6ED', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_TRUE_USD" style={{ color: '#5BB6ED', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_USDT':
                return (
                    <View style={{ ...styles.icon, borderColor: '#31D182', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: '#31D182', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_BNB':
                return (
                    <View style={{ ...styles.icon, borderColor: '#F59E6C', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_BNB" style={{ color: '#F59E6C', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_USDC':
                return (
                    <View style={{ ...styles.icon, borderColor: '#2A7FDB', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_USDC" style={{ color: '#2A7FDB', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'BSV':
                return (
                    <View style={{ ...styles.icon, borderColor: '#C8102E', backgroundColor: '#231F20', ...tmpContainerStyle }}>
                        <View style={{ ...styles.icon__item, marginTop: 1 }}>
                            <CustomIcon name="BSV" style={{ color: '#E9B712', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'ETH_PAX':
                return (
                    <View style={{ ...styles.icon, borderColor: '#02D193', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_PAX" style={{ color: '#02D193', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_DAI':
                return (
                    <View style={{ ...styles.icon, borderColor: '#FF6F45', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_DAI" style={{ color: '#FF6F45', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_DAIM':
                return (
                    <View style={{ ...styles.icon, borderColor: '#FF6F45', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_DAIM" style={{ color: '#FF6F45', fontSize: fontSize }}/>
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )

            case 'XRP':
                return (
                    <View style={{ ...styles.icon, borderColor: '#1B1818', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="XRP" style={{ color: '#1B1818', fontSize: fontSize }}/>
                        </View>
                    </View>
                )

            case 'ETH_KNC':
                return (
                    <View style={{ ...styles.icon, borderColor: '#31CB9E', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_KNC" style={{ color: '#31CB9E', fontSize: fontSize }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )

            case 'ETH_COMP':
                return (
                    <View style={{ ...styles.icon, borderColor: '#00D395', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_COMP" style={{ color: '#00D395', fontSize: fontSize }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )

            case 'ETH_BAL':
                return (
                    <View style={{ ...styles.icon, borderColor: '#303030', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_BAL" style={{ color: '#303030', fontSize: fontSize }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )

            case 'ETH_LEND':
                return (
                    <View style={{ ...styles.icon, borderColor: '#1E8FCA', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_LEND" style={{ color: '#1E8FCA', fontSize: fontSize }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )

            case 'ETH_BNT':
                return (
                    <View style={{ ...styles.icon, borderColor: '#000D2B', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_BNT" style={{ color: '#000D2B', fontSize: fontSize }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )

            case 'ETH_MKR':
                return (
                    <View style={{ ...styles.icon, borderColor: '#1AAB9B', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_MKR" style={{ color: '#1AAB9B', fontSize: fontSize }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )

            case 'CUSTOM_MVT':
                return (
                    <View style={{ ...styles.icon, borderColor: '#93CA76', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_MVT" style={{ color: '#93CA76', fontSize: fontSize }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )
            case 'FIO':
                return (
                    <View style={{ ...styles.icon, borderColor: '#4C5FAB', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: 25, height: 25 }} resize={'stretch'} source={require('../../assets/images/fio.png')}/>
                        </View>
                    </View>
                )

            case 'CUSTOM_TTCrypto':
                return (
                    <View style={{ ...styles.icon, borderColor: '#404040', ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="TRX_TTCrypto" style={{ color: '#404040', fontSize: fontSize, marginRight: 1 }}/>
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="TRX" style={{ color: '#E51A31' }} fontSize={13}/>
                        </View>
                    </View>
                )

            default:
                return (
                    <View style={{ ...styles.icon, ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Text style={styles.icon__item__text}>No</Text>
                            <Text style={styles.icon__item__text}>Icon</Text>
                        </View>
                    </View>
                )
        }

        if (typeof extend.addressCurrencyCode !== 'undefined') {
            switch (extend.addressCurrencyCode) {

                case 'ETH':
                    return (
                        <View style={{ ...styles.icon, borderColor: '#1EB3E4', ...tmpContainerStyle }}>
                            <View style={[styles.icon__item, { color: '#1EB3E4' }]}>
                                <Text style={{ fontFamily: 'SFUIDisplay-Semibold', color: '#1EB3E4', fontSize: 12 }}>
                                    {extend.currencySymbol}
                                </Text>
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                                </View>
                            </View>
                        </View>
                    )
                case 'TRX':
                    return (
                        <View style={{ ...styles.icon, borderColor: '#E51A31', ...tmpContainerStyle }}>
                            <View style={[styles.icon__item, { color: '#E51A31' }]}>
                                <Text style={{ fontFamily: 'SFUIDisplay-Semibold', color: '#E51A31', fontSize: 12 }}>
                                    {extend.currencySymbol}
                                </Text>
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <CustomIcon name="TRX" style={{ color: '#E51A31', fontSize: 12 }}/>
                                </View>
                            </View>
                        </View>
                    )
                default:
                    return (
                        <View style={{ ...styles.icon, ...tmpContainerStyle }}>
                            <View style={styles.icon__item}>
                                <Text>No</Text>
                                <Text>icon</Text>
                            </View>
                        </View>
                    )
            }
        }

    }

    render() {
        return this.renderIcon()
    }
}

ButtonLine.contextType = ThemeContext

const styles = {
    icon: {
        width: 50,
        height: 50,
        borderRadius: 50,

        borderWidth: 2,
        borderColor: '#000',

        overflow: 'visible'
    },
    icon__item: {
        alignItems: 'center',
        justifyContent: 'center',

        position: 'relative',

        width: '100%',
        height: '100%',

        borderRadius: 50,

        overflow: 'visible'
    },
    icon__item__text: {
        fontSize: 12,
        marginVertical: 0,
        lineHeight: 12,
    },

    icon__text: {
        justifyContent: 'center',
        alignItems: 'center',

        position: 'absolute',
        bottom: -6,
        left: 0,

        width: '100%'
    },
    icon__text__item: {
        paddingLeft: 3,
        paddingRight: 2,

        fontSize: 10,
        fontFamily: 'Montserrat-Bold',
        color: '#F79E1B',
    },
    icon__mark: {
        justifyContent: 'center',
        alignItems: 'center',

        position: 'absolute',
        top: 25,
        right: -4,
        width: 18,
        height: 18,

        // backgroundColor: '#f9f9f9',

        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2
    },
    icon__mark__text: {
        paddingRight: 17,
        fontSize: 8,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#fff'
    },
    icons: {
        color: '#f4f4f4',
        position: {
            start: { x: 0.0, y: 0.5 },
            end: { x: 1, y: 0.5 }
        }
    }
}
