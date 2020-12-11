/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Dimensions, PixelRatio  } from 'react-native'
import Icon from '../../../components/elements/CustomIcon.js'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'
import Moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 10
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 5 // iphone 5s
}

class RequestItem extends Component {

    humanize = (str) => str
        .replace(/^[\s_]+|[\s_]+$/g, '')
        .replace(/[_\s]+/g, ' ')
        .replace(/^[a-z]/, (m) => m.toUpperCase());

    render() {
        const { data, type, callback } = this.props
        const currencyCode = data?.content?.token_code || 'NOCOIN'
        const chainCode = data?.content?.chain_code || 'NOCOIN'
        Moment.locale('en');

        return (
            <View >
                <View style={{position: 'relative'}}>
                    <View style={styles.wrapper}>
                        <TouchableOpacity onPress={callback} >
                            <View style={styles.request__item}>
                                <View style={styles.request__col1}>
                                    <Icon name="selectWallet" size={25} style={styles.icon1}/>
                                    <View>
                                        <Text style={styles.txt1} numberOfLines={1} ellipsizeMode='tail'>{type === 'sent' ? data?.payer_fio_address :  data?.payee_fio_address}</Text>
                                        <Text style={styles.txt2}>{Moment(data?.time_stamp).format('lll')} {data?.content?.memo && `- ${data?.content?.memo}`}</Text>
                                        {data.status && <Text style={[styles.status, data.status === 'rejected' ? styles.error : styles.success]} >{this.humanize(data.status)}</Text>  }
                                    </View>
                                </View>

                                <View style={styles.request__col2}>
                                    <CurrencyIcon currencyCode={currencyCode !== chainCode ? `${chainCode}_${currencyCode}` : currencyCode}
                                                  containerStyle={styles.cryptoList__icoWrap}
                                                  markStyle={styles.cryptoList__icon__mark}
                                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                                  iconStyle={styles.cryptoList__icon}/>
                                    <View>
                                        <Text style={styles.txt3}>{data?.content?.amount && data?.content?.amount !== 'null' ? data.content.amount : '-'}</Text>
                                        {/* <Text style={styles.txt4}>$ 0.0 {data?.content?.sumUSD}</Text> */}
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

/*
* LOG  {"content": {"amount": "1", "chain_code": "BTC", "hash": null, "memo": "some memo", "offline_url": null, "payee_public_address": "1Ppa9CzfAYLd5pUyFGc5GzFwDUUBkCVJVr", "token_code": "BTC"}, "fio_request_id": 759, "payee_fio_address": "kir@fiotestnet", "pay
 ee_fio_public_key": "FIO5xbYYdNs5a7Fe5nmkb7BeUFjpXYgkmJus8NMZUAeNyt8jgsEwB", "payer_fio_address": "kir2@fiotestnet", "payer_fio_public_key": "FIO67fELa4N8pLNJFGLnDwqLhiUo1zf5A1gwsTD8muoSDYmTUQSF6", "status": "requested", "time_stamp": "2020-10-05T10:54:44"}

 * */

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
        marginBottom: -4,
        minWidth: '50%',
    },

    txt4: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 13,
    },

    status: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        marginTop: 5,
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
