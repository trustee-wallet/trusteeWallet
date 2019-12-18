import React, { Component } from 'react'
import { View, TouchableOpacity, Dimensions, Text, TextInput } from 'react-native'

import Modal from 'react-native-modal'
import QRCode from 'react-native-qrcode-svg'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { strings } from '../../../services/i18n'

import { hideModal } from '../../../appstores/Actions/ModalActions'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'

const { width: SCREEN_WIDTH } = Dimensions.get('window')


export default class SelectTradeCryptocurrencyModal extends Component {

    constructor(props){
        super(props)
        this.state = {

        }
    }

    componentWillMount() {

    }

    handleHide = () => hideModal()

    handleSelectTradeCryptocurrency = (cryptocurrency) => {
        this.props.data.data.handleSelectTradeCryptocurrency(cryptocurrency)
        hideModal()
    }

    render() {

        const { title, availableCryptocurrencies } = this.props.data.data

        return (
            <Modal style={{ padding: 0,  margin: 0, justifyContent: 'flex-end' }} visible={this.props.show}>
                <View style={styles.content}>
                    <View style={styles.top}>
                        <View style={{ width: 22 }} />
                        <Text style={styles.title}>
                            { title }
                        </Text>
                        <TouchableOpacity onPress={this.handleHide}>
                            <AntDesignIcon name='close' size={22} color='#404040' />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bottom}>
                        {
                            availableCryptocurrencies.map(item => {
                                return (
                                    <View style={styles.btnWrap}>
                                        <TouchableOpacity style={styles.btn} onPress={() => this.handleSelectTradeCryptocurrency(item)}>
                                            <CurrencyIcon currencyCode={item.currencyCode}
                                                          containerStyle={styles.btn__icoWrap}
                                                          markStyle={styles.btn__icon}
                                                          markTextStyle={styles.btn__icon__mark__text}
                                                          iconStyle={styles.btn__icon}/>
                                            <View style={styles.btn__description}>
                                                <Text style={styles.btn__title}>{ item.currencyName }</Text>
                                                <Text style={styles.btn__subtitle}>{ item.currencySymbol }</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )
                            })
                        }
                    </View>
                </View>
            </Modal>
        )
    }
}

const styles = {
    content: {
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    top: {
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',

        paddingTop: 20,
        paddingBottom: 25,
        paddingHorizontal: 15,

        borderBottomColor: '#8e96b5',
        borderBottomWidth: 1,
        borderStyle: 'solid'
    },
    title: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    address: {
        marginVertical: 5,
        marginBottom: 40,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040',
        textAlign: 'center'
    },
    text: {
        marginTop: 5
    },
    qr: {
        position: 'relative',
        justifyContent: 'center',

        marginTop: 20,
        marginLeft: SCREEN_WIDTH/2 - 60
    },
    input: {
        height: 44,

        paddingHorizontal: 30,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center'
    },
    input__text: {
        flex: 1,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
    },
    line: {
        borderBottomColor: '#8e96b5',
        borderBottomWidth: 1,
        borderStyle: 'solid'
    },
    bottom: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',

        paddingTop: 20,
        paddingBottom: 20
    },
    btnWrap: {
        width: '50%',
        height: 60,
    },
    btn: {
        flex: 1,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        marginBottom: 10,
        marginHorizontal: 5,
        paddingVertical: 10,
        paddingHorizontal: 5,

        borderRadius: 50,
        backgroundColor: '#fff',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3
    },
    btn__description: {
        marginRight: 'auto',
        marginLeft: 10
    },
    btn__title: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    btn__subtitle: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999'
    },
    btn__icoWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 22
    },
    btn__icon: {
        fontSize: 16
    },
    btn__icon__mark: {
        bottom: 5,
    },
    btn__icon__mark__text: {
        fontSize: 5
    },
    btn__arrow: {
        marginRight: 10,

        fontSize: 20,
        color: '#7127ac'
    }

}
