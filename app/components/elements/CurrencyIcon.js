import React, { Component } from 'react'

import {
    View,
    Text
} from "react-native"

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

        const { currencyCode, containerStyle, markStyle, markTextStyle, iconStyle } = this.props

        const fontSize = typeof iconStyle != 'undefined' ? iconStyle.fontSize : 24

        const tmpContainerStyle = typeof containerStyle != 'undefined' ? containerStyle : null

        const tmpMarkStyle = typeof markStyle != 'undefined' ? markStyle : null

        const tmpMarkTextStyle = typeof markTextStyle != 'undefined' ? markTextStyle : null

        const {
            position,
        } = styles.icons

        switch (currencyCode) {
            case 'LTC':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#5694A9', '#60BBF5']}
                            start={position.start}
                            end={position.end}>
                            <CustomIcon name="LTC" style={{ color: '#f4f4f4', fontSize: fontSize }}/>
                        </GradientView>
                    </View>
                )
            case 'ETH':
            case 'ETH_ROPSTEN':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#145de3', '#4ec8f7']}
                            start={position.start}
                            end={position.end}>
                            <Icon name="ethereum" size={fontSize} color={'#f4f4f4'}/>
                        </GradientView>
                    </View>
                )
            case 'BTC':
            case 'BTC_TEST':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#e67947', '#f9f871']}
                            start={position.start}
                            end={position.end}>
                            <Icon name="bitcoin" size={fontSize} color={'#f4f4f4'}/>
                        </GradientView>
                    </View>
                )
            case 'USDT':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#3ac058', '#27e3ae']}
                            start={position.start}
                            end={position.end}>
                            <CustomIcon name="USDT" style={{ color: '#f4f4f4', fontSize: fontSize }}/>
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    OMNI
                                </Text>
                            </GradientView>
                        </GradientView>
                    </View>
                )
            case 'ETH_TRUE_USD':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#000', '#5dc9bc']}
                            start={position.start}
                            end={position.end}>
                            <EthTrueUsd width={fontSize} height={fontSize} />
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    ETH
                                </Text>
                            </GradientView>
                        </GradientView>
                    </View>
                )
            case 'ETH_USDT':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#3ac058', '#27e3ae']}
                            start={position.start}
                            end={position.end}>
                            <CustomIcon name="USDT" style={{ color: '#f4f4f4', fontSize: fontSize }}/>
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    ETH
                                </Text>
                            </GradientView>
                        </GradientView>
                    </View>
                )
            case 'ETH_BNB':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#f59e6c', '#f3ba2f']}
                            start={position.start}
                            end={position.end}>
                            <EthBnbIcon width={fontSize} height={fontSize} />
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    ETH
                                </Text>
                            </GradientView>
                        </GradientView>
                    </View>
                )
            case 'ETH_USDC':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#1b4e85', '#2a7fdb']}
                            start={position.start}
                            end={position.end}>
                            <EthUsdCoin width={fontSize} height={fontSize} />
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    ETH
                                </Text>
                            </GradientView>
                        </GradientView>
                    </View>
                )
            case 'ETH_PAX':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#02845d', '#02d193']}
                            start={position.start}
                            end={position.end}>
                            <EthPax width={fontSize} height={fontSize} />
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    ETH
                                </Text>
                            </GradientView>
                        </GradientView>
                    </View>
                )
            case 'ETH_DAI':
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#ff6f45', '#ffcb38']}
                            start={position.start}
                            end={position.end}>
                            <EthDai width={fontSize} height={fontSize} />
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    ETH
                                </Text>
                            </GradientView>
                        </GradientView>
                    </View>
                )

            default:
                return (
                    <View style={{...styles.icon, ...tmpContainerStyle}}>
                        <GradientView
                            style={styles.icon__item}
                            array={['#145de3','#4ec8f7']}
                            start={position.start}
                            end={position.end}>
                            <EthErc20 width={fontSize} height={fontSize} />
                            <GradientView
                                style={{...styles.icon__mark, ...tmpMarkStyle}}
                                array={['#7E55D2', '#AC8FEA']}
                                start={position.start}
                                end={position.end}>
                                <Text style={{...styles.icon__mark__text, ...tmpMarkTextStyle}}>
                                    ETH
                                </Text>
                            </GradientView>
                        </GradientView>
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

        backgroundColor: '#fff',

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
    },
    icon__item: {
        alignItems: 'center',
        justifyContent: 'center',

        position: 'relative',

        width: '100%',
        height: '100%',

        borderRadius: 50,
        overflow: 'hidden'
    },
    icon__mark: {
        position: 'absolute',
        bottom: 7,
        right: -15,

        paddingTop: 1,
        paddingLeft: 3,
        paddingRight: 3,
        paddingBottom: 1,

        borderRadius: 4
    },
    icon__mark__text: {
        paddingRight: 20,
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