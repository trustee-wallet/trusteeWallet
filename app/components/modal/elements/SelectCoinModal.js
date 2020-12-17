/**
 * @version 0.9
 */
import React, { Component } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native'

import Modal from 'react-native-modal'

import GradientView from '../../../components/elements/GradientView'
import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'
import { strings, sublocale } from '../../../services/i18n'
import Entypo from 'react-native-vector-icons/Entypo'

import CurrencyIcon from '../../../components/elements/CurrencyIcon'
const { height: WINDOW_HEIGHT } = Dimensions.get('window')


class ModalCoin extends Component {

    render() {
        const { cryptoCurrency, callback } = this.props
        const currencyCode = cryptoCurrency?.currencyCode || 'NOCOIN'

        return (
            <TouchableOpacity onPress={callback} >
                <View style={styles.coinRow}>
                    <View  style={styles.coinRowInfo}>
                        <CurrencyIcon currencyCode={currencyCode}
                                      containerStyle={styles.cryptoList__icoWrap}
                                      markStyle={styles.cryptoList__icon__mark}
                                      markTextStyle={styles.cryptoList__icon__mark__text}
                                      iconStyle={styles.cryptoList__icon}/>
                        <View>
                            <Text style={styles.txt2}>{cryptoCurrency.currencySymbol}</Text>
                            <Text style={styles.txt3}>{cryptoCurrency.currencyName}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

}

export class SelectCoinModal extends Component {

    constructor(props) {
        super(props)
        this.state = {
            cryptoCurrencies: props.data.data.cryptoCurrencies || [],
        }
    }

    currencySelected = (currencyCode) => {
        const { callback } = this.props
        if (callback) {
            callback(currencyCode)
        }
        hideModal()
    }

    renderCoins = (data) => {
        return (
            data.map((item, key) => (
                <ModalCoin
                    key={key}
                    cryptoCurrency={item}
                    callback={() => this.currencySelected(item.currencyCode) }
                />
            ))
        )
    }

    render() {
        const { show } = this.props

        let sub = sublocale()
        if (sub !== 'uk' && sub !== 'ru') {
            sub = 'en'
        }

        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={show}>
                <View style={styles.content}>
                    <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
                        <TouchableOpacity onPress={hideModal} style={styles.cross}>
                            <Entypo style={styles.cross} name="cross" size={22} color={'#f4f4f4'}/>
                        </TouchableOpacity>
                        <Text style={styles.title}>
                            {strings('modal.selectCoinFio.title')}
                        </Text>
                        <Text style={styles.subtitle}>
                            {strings('modal.selectCoinFio.description')}
                        </Text>

                        <ScrollView style={{ width: '100%', backgroundColor: '#f5f5f5', padding: 20, maxHeight: WINDOW_HEIGHT - 250 }}>
                            {this.renderCoins(this.state.cryptoCurrencies)}
                        </ScrollView>

                        <Text style={styles.text2}>
                            {strings('modal.selectCoinFio.description2')}
                        </Text>

                    </GradientView>
                </View>
            </Modal>
        )
    }
}

const styles_ = {
    array: ['#222', '#555'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

export default SelectCoinModal

const styles = {
    modal: {
        justifyContent: 'center',
        maxHeight: WINDOW_HEIGHT - 50
    },
    content: {
        //height: 450,
        borderRadius: 14,
        backgroundColor: '#333',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4

    },
    bg: {
        paddingTop: 15,

        alignItems: 'center',
        borderRadius: 15
    },
    cross: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 14
    },
    title: {
        marginBottom: 5,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        color: '#f4f4f4'
    },
    subtitle: {
        marginBottom: 15,
        marginHorizontal: 20,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 15,
        color: '#f4f4f4'
    },
    text: {
        width: '100%',
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        textAlign: 'left',
        color: '#000'
    },
    text2: {
        width: '100%',
        padding: 10,
        paddingHorizontal: 20,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        textAlign: 'left',
        color: '#fff'
    },

    coinRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingTop: 10,
        paddingBottom: 15,
        borderColor: '#ddd',
        borderBottomWidth: 1
    },

    coinRowInfo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
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
