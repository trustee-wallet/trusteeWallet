import React, { Component } from 'react'

import {
    Image,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

import Ethereum from "../../assets/images/ethereumBlue.svg"

import Bitcoin from "../../assets/images/btc.svg"

import Tether from "../../assets/images/usdtGreen.svg"

import Refresh from "../../assets/images/refresh.svg"

import Change from "../../assets/images/changeIcon.svg"

import QRCodeBtn from "../../assets/images/qrCodeBtn.svg"

import FontAwesome from "react-native-vector-icons/FontAwesome"

import FontAwesome5 from "react-native-vector-icons/FontAwesome5"

import Entypo from "react-native-vector-icons/Entypo"

import EthBnbIcon from '../../assets/images/ethBnbColor.svg'
import EthUsdCoin from '../../assets/images/ethUsdCoinColor.svg'
import EthTrueUsd from '../../assets/images/ethTrueUsdColor.svg'
import EthPax from '../../assets/images/ethPaxColor.svg'
import EthDai from '../../assets/images/ethDaiColor.svg'
import Litecoin from '../../assets/images/litecoin.svg'
import EthErc20 from '../../assets/images/ethErc20Color.svg'
import GradientView from './GradientView'

import BitTorrent from '../../assets/images/bittorrent.png'
import Dogecoin from '../../assets/images/dogecoin.png'
import Verge from '../../assets/images/verge.png'


export default class ButtonIcon extends Component {

    constructor(props){
        super(props)
    }

    handleIcon = () => {
        const { icon } = this.props

        switch(icon){
            case 'ETH_ONE':
                return (
                    <View style={styles.icon__wrap}>
                        <Image style={{ width: 24, height: 24 }} source={require('../../assets/images/harmony-one.png')} />
                        <GradientView
                            style={styles.icon__mark}
                            array={['#7E55D2', '#AC8FEA']}
                            start={styles.icons.position.start}
                            end={styles.icons.position.end}>
                            <Text style={styles.icon__mark__text}>
                                ETH
                            </Text>
                        </GradientView>
                    </View>
                )

            case 'TRX_USDT':
                return (
                    <View style={styles.icon__wrap}>
                        <Tether width={20} height={35} />
                        <GradientView
                            style={styles.icon__mark}
                            array={['#7E55D2', '#AC8FEA']}
                            start={styles.icons.position.start}
                            end={styles.icons.position.end}>
                            <Text style={styles.icon__mark__text}>
                                TRX
                            </Text>
                        </GradientView>
                    </View>
                )

            case 'TRX_BTT':
                return (
                    <View style={styles.icon__wrap}>
                        <Image style={{ width: 25, height: 25 }} source={BitTorrent} />
                        <GradientView
                            style={styles.icon__mark}
                            array={['#7E55D2', '#AC8FEA']}
                            start={styles.icons.position.start}
                            end={styles.icons.position.end}>
                            <Text style={styles.icon__mark__text}>
                                TRX
                            </Text>
                        </GradientView>
                    </View>
                )
            case 'XVG':
                return (
                    <Image style={{ width: 25, height: 25 }} source={Verge} />
                )
            case 'DOGE':
                return (
                    <Image style={{ width: 30, height: 30 }} source={Dogecoin} />
                )
            case 'ETH_SOUL':
                return (
                    <View style={styles.icon__wrap}>
                        <Image style={{ width: 30, height: 30 }} source={require('../../assets/images/ethSOUL.png')} />
                        <GradientView
                            style={styles.icon__mark}
                            array={['#7E55D2', '#AC8FEA']}
                            start={styles.icons.position.start}
                            end={styles.icons.position.end}>
                            <Text style={styles.icon__mark__text}>
                                ETH
                            </Text>
                        </GradientView>
                    </View>
                )

            case 'LTC':
                return (
                    <Litecoin width={20} height={35} />
                )
            case 'TRX':
                return (
                    <Image style={{ width: 20, height: 25 }} source={require('../../assets/images/trx.png')} />
                )
            case 'ETH':
            case 'ETH_ROPSTEN':
            case 'ETH_MAINNET':
                return (
                        <Ethereum width={20} height={35} />
                    )
            case 'BTC_TEST':
            case 'BTC':
                return (
                        <Bitcoin width={20} height={35} />
                    )
            case 'USDT':

                return (
                        <View style={styles.icon__wrap}>
                            <Tether width={20} height={35} />
                            <GradientView
                                style={styles.icon__mark}
                                array={['#7E55D2', '#AC8FEA']}
                                start={styles.icons.position.start}
                                end={styles.icons.position.end}>
                                <Text style={styles.icon__mark__text}>
                                    OMNI
                                </Text>
                            </GradientView>
                        </View>
                    )

            case 'ETH_BNB':

                return (
                    <View style={styles.icon__wrap}>
                        <EthBnbIcon width={24} height={24} />
                        <GradientView
                            style={styles.icon__mark}
                            array={['#7E55D2', '#AC8FEA']}
                            start={styles.icons.position.start}
                            end={styles.icons.position.end}>
                            <Text style={styles.icon__mark__text}>
                                ETH
                            </Text>
                        </GradientView>
                    </View>
                    )

            case 'ETH_USDC':

                return (
                        <View style={styles.icon__wrap}>
                            <EthUsdCoin width={24} height={24} />
                            <GradientView
                                style={styles.icon__mark}
                                array={['#7E55D2', '#AC8FEA']}
                                start={styles.icons.position.start}
                                end={styles.icons.position.end}>
                                <Text style={styles.icon__mark__text}>
                                    ETH
                                </Text>
                            </GradientView>
                        </View>
                    )

            case 'ETH_TRUE_USD':

                return (
                    <View style={styles.icon__wrap}>
                        <EthTrueUsd width={24} height={24} />
                        <GradientView
                            style={styles.icon__mark}
                            array={['#7E55D2', '#AC8FEA']}
                            start={styles.icons.position.start}
                            end={styles.icons.position.end}>
                            <Text style={styles.icon__mark__text}>
                                ETH
                            </Text>
                        </GradientView>
                    </View>
                    )

            case 'ETH_USDT':

                return (
                        <View style={styles.icon__wrap}>
                            <Tether width={20} height={35} />
                            <GradientView
                                style={styles.icon__mark}
                                array={['#7E55D2', '#AC8FEA']}
                                start={styles.icons.position.start}
                                end={styles.icons.position.end}>
                                <Text style={styles.icon__mark__text}>
                                    ETH
                                </Text>
                            </GradientView>
                        </View>
                    )

            case 'ETH_PAX':

                return (
                        <View style={styles.icon__wrap}>
                            <EthPax width={24} height={24} />
                            <GradientView
                                style={styles.icon__mark}
                                array={['#7E55D2', '#AC8FEA']}
                                start={styles.icons.position.start}
                                end={styles.icons.position.end}>
                                <Text style={styles.icon__mark__text}>
                                    ETH
                                </Text>
                            </GradientView>
                        </View>
                    )

            case 'ETH_DAI':

                return (
                        <View style={styles.icon__wrap}>
                            <EthDai width={24} height={24} />
                            <GradientView
                                style={styles.icon__mark}
                                array={['#7E55D2', '#AC8FEA']}
                                start={styles.icons.position.start}
                                end={styles.icons.position.end}>
                                <Text style={styles.icon__mark__text}>
                                    ETH
                                </Text>
                            </GradientView>
                        </View>
                    )

            case 'refresh':

                return (
                        <Refresh width={20} height={35} />
                    )
            case 'change':

                return (
                        <Change width={20} height={35} />
                    )
            case 'QR_CODE_BTN':

                return ( <QRCodeBtn width={20} height={19} /> )
            case 'FACEBOOK':

                return ( <FontAwesome name="facebook" size={19} color='#fff' /> )
            case 'TWITTER':

                return ( <FontAwesome name="twitter" size={19} color='#fff' /> )
            case 'WHATSAPP':

                return ( <FontAwesome name="whatsapp" size={18} color='#fff' /> )
            case 'EMAIL':

                return ( <FontAwesome name="envelope-o" size={18} color='#fff' /> )
            case 'DOTS':

                return ( <Entypo name="dots-three-horizontal" size={19} color='#fff' /> )
            case 'VIBER':

                return ( <FontAwesome5 name="viber" size={19} color='#fff' /> )
            case 'TELEGRAM':

                return ( <FontAwesome5 name="telegram-plane" size={19} color='#fff' /> )
            case 'INSTAGRAM':

                return ( <FontAwesome5 name="instagram" size={19} color='#fff' /> )
            default:
                return ( <EthErc20 width={24} height={24} /> )
        }
    }

    render() {

        const { style, callback, disabled } = this.props

        return (
            <View style={{...styles.wrapper, ...style}}>
                <TouchableOpacity disabled={typeof disabled != 'undefined' ? disabled : false } onPress={callback} style={{...styles.btn, ...style}}>
                    { this.handleIcon() }
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = {
    wrapper: {
        width: 46,
        height: 46,
        marginBottom: 10,
        borderRadius: 23,
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
    icon: {
        width: 20,
        height: 20
    },
    btn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 46,
        height: 46,
        borderRadius: 23,

        //overflow: 'hidden',

        backgroundColor: '#fff'
    },
    icons: {
        color: '#f4f4f4',
        position: {
            start: { x: 0.0, y: 0.5 },
            end: { x: 1, y: 0.5 }
        },
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
    icon__wrap: {
        position: 'relative',

        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',
        height: '100%',
        overflow: 'hidden',

        borderRadius: 23,
    },
    icon__mark__text: {
        paddingRight: 20,
        fontSize: 7,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#fff'
    },
}