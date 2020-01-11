import React, { Component } from 'react'

import {
    View,
    Text,
    Image,
    Platform
} from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import CustomIcon from './CustomIcon'

import GradientView from '../../components/elements/GradientView'

import EthBnbIcon from '../../assets/images/ethBnb.svg'
import EthUsdCoin from '../../assets/images/ethUsdCoin.svg'
import EthTrueUsd from '../../assets/images/ethTrueUsd.svg'
import EthPax from '../../assets/images/ethPax.svg'
import EthDai from '../../assets/images/ethDai.svg'
import EthErc20 from '../../assets/images/ethErc20.svg'


export default class ButtonLine extends Component {

    constructor(props){
        super(props)
    }

    renderIcon = () => {

        const { currencyCode, containerStyle, markStyle, markTextStyle, iconStyle, textContainerStyle, textStyle } = this.props

        const fontSize = typeof iconStyle != 'undefined' ? iconStyle.fontSize : 24

        const tmpContainerStyle = typeof containerStyle != 'undefined' ? containerStyle : null

        const tmpMarkStyle = typeof markStyle != 'undefined' ? markStyle : null

        const tmpMarkTextStyle = typeof markTextStyle != 'undefined' ? markTextStyle : null

        const {
            position,
        } = styles.icons

        switch (currencyCode) {
            case 'ETH_ONE':
                return (
                    <View style={{...styles.icon, borderColor: "#35D4D3", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_ONE" style={{ color: '#35D4D3', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )

            case 'TRX_USDT':
                return (
                    <View style={{...styles.icon, borderColor: "#31D182", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: '#31D182', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name="TRX" style={{ color: '#E51A31'}} fontSize={13} />
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case 'TRX_BTT':
                return (
                    <View style={{...styles.icon, borderColor: "#D73A64", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="TRX_BTT" style={{ color: '#D73A64', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name="TRX" style={{ color: '#E51A31'}} fontSize={13} />
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case 'XVG':
                return (
                    <View style={{...styles.icon, borderColor: "#00CBFF", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="XVG" style={{ color: '#00CBFF', fontSize: fontSize }} />
                        </View>
                    </View>
                )

            case 'DOGE':
                return (
                    <View style={{...styles.icon, borderColor: "#CEB55C", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="DOGE" style={{ color: '#CEB55C', fontSize: fontSize }}/>
                        </View>
                    </View>
                )

            case 'ETH_SOUL':
                return (
                    <View style={{...styles.icon, borderColor: "#A1B8CE", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: 25, height: 25 }} resize={'stretch'} source={require('../../assets/images/ethSOUL.png')} />
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'TRX':
                return (
                    <View style={{...styles.icon, borderColor: "#E51A31", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="TRX" style={{ color: '#E51A31', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'LTC':
                return (
                    <View style={{...styles.icon, borderColor: "#60BBF5", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="LTC" style={{ color: "#60BBF5", fontSize: fontSize }} />
                        </View>
                    </View>
                )
            case 'ETH':
            case 'ETH_ROPSTEN':
                return (
                    <View style={{...styles.icon, borderColor: "#1EB3E4", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <Icon name="ethereum" size={fontSize} color={'#1EB3E4'}/>
                        </View>
                    </View>
                )
            case 'BTC':
            case 'BTC_TEST':
                return (
                    <View style={{...styles.icon, borderColor: "#F79E1B", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BTC" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'BTC_SEGWIT':
                return (
                    <View style={{...styles.icon, borderColor: "#F79E1B", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BTC" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                            <View style={{...styles.icon__text, ...textContainerStyle}}>
                                <Text style={{...styles.icon__text__item, ...textStyle}}>
                                    SW
                                </Text>
                            </View>
                        </View>
                    </View>
                )
            case 'BTC_SEGWIT_COMPATIBLE':
                return (
                    <View style={{...styles.icon, borderColor: "#F79E1B", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BTC" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                            <View style={{...styles.icon__text, ...textContainerStyle}}>
                                <Text style={{...styles.icon__text__item, ...textStyle}}>
                                    SWC
                                </Text>
                            </View>
                        </View>
                    </View>
                )
            case 'BCH':
                return (
                    <View style={{...styles.icon, borderColor: "#F79E1B", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BCH" style={{ color: '#F79E1B', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'BTG':
                return (
                    <View style={{...styles.icon, borderColor: "#132365", borderWidth: 1, ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <View style={{ padding: 3, borderWidth: 5, borderColor: "#E1A600", borderRadius: 30 }}>
                                <View style={{ marginTop: Platform.OS === "ios" ? -1 : 0 }}>
                                    <CustomIcon name="BTG" style={{ color: '#132365', fontSize: fontSize }}/>
                                </View>
                            </View>
                        </View>
                    </View>
                )
            case 'USDT':
                return (
                    <View style={{...styles.icon, borderColor: "#31D182", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: '#31D182', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="bitcoin" size={14} color={'#F79E1B'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_TRUE_USD':
                return (
                    <View style={{...styles.icon, borderColor: "#5BB6ED", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_TRUE_USD" style={{ color: '#5BB6ED', fontSize: fontSize }} />
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_USDT':
                return (
                    <View style={{...styles.icon, borderColor: "#31D182", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: '#31D182', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                    <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_BNB':
                return (
                    <View style={{...styles.icon, borderColor: "#F59E6C", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_BNB" style={{ color: '#F59E6C', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_USDC':
                return (
                    <View style={{...styles.icon, borderColor: "#2A7FDB", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_USDC" style={{ color: '#2A7FDB', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'BSV':
                return (
                    <View style={{...styles.icon, borderColor: "#C8102E", backgroundColor: "#231F20", ...tmpContainerStyle}}>
                        <View style={{...styles.icon__item, marginTop: 1}}>
                            <CustomIcon name="BSV" style={{ color: '#E9B712', fontSize: fontSize }}/>
                        </View>
                    </View>
                )
            case 'ETH_PAX':
                return (
                    <View style={{...styles.icon, borderColor: "#02D193", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_PAX" style={{ color: '#02D193', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_DAI':
                return (
                    <View style={{...styles.icon, borderColor: "#FF6F45", ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_DAI" style={{ color: '#FF6F45', fontSize: fontSize }}/>
                            <View
                                style={{...styles.icon__mark, ...tmpMarkStyle}}>
                                <Icon name="ethereum" size={14} color={'#1EB3E4'}/>
                            </View>
                        </View>
                    </View>
                )
            default:
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <View style={styles.icon__item}>
                            <Text>New</Text>
                        </View>
                    </View>
                )
        }

    }

    render() {
        return this.renderIcon()
    }
}

const styles = {
    icon: {
        width: 50,
        height: 50,
        borderRadius: 50,

        borderWidth: 2,
        borderColor: "#000",

        overflow: "visible"
    },
    icon__item: {
        alignItems: 'center',
        justifyContent: 'center',

        position: 'relative',

        width: '100%',
        height: '100%',

        borderRadius: 50,

        overflow: "visible"
    },
    icon__text: {
        justifyContent: "center",
        alignItems: "center",

        position: "absolute",
        bottom: -6,
        left: 0,

        width: "100%",
    },
    icon__text__item: {
        paddingLeft: 3,
        paddingRight: 2,

        fontSize: 10,
        fontFamily: "Montserrat-Bold",
        color: "#F79E1B",

        backgroundColor: "#f9f9f9"
    },
    icon__mark: {
        justifyContent: "center",
        alignItems: "center",

        position: 'absolute',
        top: 25,
        right: -4,
        width: 18,
        height: 18,

        backgroundColor: "#f9f9f9",

        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,
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
        },
    }
}