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

    constructor(props) {
        super(props)
    }



    render() {

        const { data, callback } = this.props
        const currencyCode = data?.content?.chain_code || 'NOCOIN'
        
        return (
            <View >
                <View style={{position: 'relative'}}>
                    <View style={styles.wrapper}>
                        <TouchableOpacity onPress={callback} >
                            <View style={styles.request__item}>
                                <View style={styles.request__col1}>
                                    <Icon name="selectWallet" size={25} style={styles.icon1}/>
                                    <View>
                                        {data.status == 'requested' && <Text style={styles.txt1} numberOfLines={1} ellipsizeMode='tail'>{data.payee_fio_address}</Text>}
                                        {data.type == 'sent' && <Text style={styles.txt1}>{data.from}</Text>}
                                        {data.type == 'pending' && <Text style={styles.txt1}>{data.title}</Text>}
                                        <Text style={styles.txt2}>{data.time} - {data.descr}</Text>
                                        <Text style={[styles.status, data.status == 'Rejected' ? styles.error : styles.success]} >{data.status}</Text>
                                    </View>
                                </View>

                                <View style={styles.request__col2}>
                                    <CurrencyIcon currencyCode={currencyCode}
                                                  containerStyle={styles.cryptoList__icoWrap}
                                                  markStyle={styles.cryptoList__icon__mark}
                                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                                  iconStyle={styles.cryptoList__icon}/>
                                    <View>
                                        <Text style={styles.txt3}>{data.sum}</Text>
                                        <Text style={styles.txt3}>{data?.content?.amount}</Text>
                                        <Text style={styles.txt4}>{data.sumUSD}</Text>
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
        paddingVertical: 10,
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
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginRight: 50,
    },

    request__col2: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexBasis: '24%',
        alignItems: 'center',
    },

    icon1: {
        marginRight: 10,
        color: '#aaa',
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
        marginBottom: -5,
    },

    txt3: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 13,
        marginBottom: -10,
        minWidth: '50%',
    },

    txt4: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 13,
    },

    status: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
    },

    error: {
        color: '#ff0000',
    },

    success: {
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
