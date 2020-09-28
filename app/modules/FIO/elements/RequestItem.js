/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, KeyboardAvoidingView, SafeAreaView, TouchableOpacity, Dimensions, PixelRatio  } from 'react-native'
import { strings } from '../../../services/i18n'
import Icon from '../../../components/elements/CustomIcon.js'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 10
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 5 // iphone 5s
}

class RequestItem extends Component {


    render() {
        return (
            <View >
                <View style={{position: 'relative'}}>
                    <View style={styles.wrapper}>
                        <TouchableOpacity onPress={() => console.log("Request pressed")}>
                            <View style={styles.request__item}>
                                <View style={styles.request__col1}>
                                    <Icon name="selectWallet" size={35} style={styles.icon1}/>
                                    <View>
                                        <Text style={styles.txt1}>Requested BTC</Text>
                                        <Text style={styles.txt2}>4:42 PM - Demo request</Text>
                                        <Text style={styles.status}>Received</Text>
                                    </View>
                                </View>

                                <View style={styles.request__col2}>
                                    <CurrencyIcon currencyCode={'BTC'}
                                                  containerStyle={styles.cryptoList__icoWrap}
                                                  markStyle={styles.cryptoList__icon__mark}
                                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                                  iconStyle={styles.cryptoList__icon}/>
                                    <View>
                                        <Text style={styles.txt3}>0.0005</Text>
                                        <Text style={styles.txt4}>$ 0.04</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.shadow}>
                        <View style={styles.shadow__item}/>
                    </View>
                </View>
            </View>
        );
    }
}

export default RequestItem


const styles = {

    wrapper: {
        position: 'relative',
        marginTop: SIZE - 1,
        marginBottom: 5,
        backgroundColor: '#fff',
        borderRadius: 16,
        zIndex: 2
    },

    request__item: {
        position: 'relative',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    request__col1: {
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 50,
    },

    request__col2: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    icon1: {
        marginRight: 10,
        color: '#555',
    },

    txt1: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 18,
        lineHeight: 22,
    },

    txt2: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#777',
    },

    txt3: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 15,
        marginBottom: -5,
        color: '#F79E1B',
    },

    txt4: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 15,
    },

    status: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#3ac058',
    },

    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
    },

    shadow__item: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        width: '100%',
        height: '50%',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
        opacity: 0.3,
        elevation: 10
    },

    cryptoList__icoWrap: {
        width: 42,
        height: 42,
        marginRight: 7,
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


}
