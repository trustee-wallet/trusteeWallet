import React, { Component } from 'react'
import { View, TouchableOpacity, Dimensions, Text, TextInput } from 'react-native'

import Modal from 'react-native-modal'
import QRCode from 'react-native-qrcode-svg'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FeatherIcon from 'react-native-vector-icons/Feather'

import { hideModal } from '../../../appstores/Actions/ModalActions'
import { copyToClipboard, normalizeWithDecimals } from '../../../services/utils'
import Toast from '../../../services/Toast/Toast'
import { strings } from '../../../services/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default class CustomReceiveAmountModal extends Component {

    constructor(props){
        super(props)
        this.state = {
            value: '',
            visible: false,
            dataForQr: ''
        }
    }

    componentWillMount() {
        const dataForQr = this.getDataForQR(this.state.value)

        this.setState({
            dataForQr: JSON.stringify(dataForQr).replace(/"/g, '')
        })
    }

    handleHide = () => {
        hideModal()
    }

    getDataForQR = (amount) => {
        const { address, currencyCode } = this.props.data.data

        switch (currencyCode) {
            case 'BTC':
                return `bitcoin:${address}${amount * 1 !== 0 ? `?amount=${amount}` : ''}`
            case 'ETH':
                return `ethereum:${address}${amount * 1 !== 0 ? `?value=${amount}` : ''}`
            default:
                return address
        }

    }

    handleInput = (value) => {

        const tmpValue = normalizeWithDecimals(this.state.value + value, 5)

        const dataForQr = this.getDataForQR(tmpValue)

        this.setState({
            value: tmpValue,
            dataForQr: JSON.stringify(dataForQr).replace(/"/g, '')
        })
    }

    handleDelete = () => {
        this.setState({
            value: this.state.value.slice(0, -1),
            dataForQr: JSON.stringify(this.getDataForQR(this.state.value.slice(0, -1))).replace(/"/g, '')
        })
    }

    copyToClip = () => {
        const { address } = this.props.data.data

        copyToClipboard(address)

        Toast.setMessage(strings('toast.copied')).show(40)
    }

    render() {

        const { title, address, currencySymbol } = this.props.data.data

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
                    <View style={styles.input}>
                        <TextInput style={styles.input__text} placeholder='0' value={this.state.value} editable={false} />
                        <Text>{ currencySymbol }</Text>
                    </View>
                    <View style={styles.line} />
                    <View style={styles.keyboard}>
                        <View style={styles.keyboard__row}>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('1')}>
                                    <Text style={styles.keyboard__text}>
                                        1
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('2')}>
                                    <Text style={styles.keyboard__text}>
                                        2
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('3')}>
                                    <Text style={styles.keyboard__text}>
                                        3
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.keyboard__row}>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('4')}>
                                    <Text style={styles.keyboard__text}>
                                        4
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('5')}>
                                    <Text style={styles.keyboard__text}>
                                        5
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('6')}>
                                    <Text style={styles.keyboard__text}>
                                        6
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.keyboard__row}>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('7')}>
                                    <Text style={styles.keyboard__text}>
                                        7
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('8')}>
                                    <Text style={styles.keyboard__text}>
                                        8
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('9')}>
                                    <Text style={styles.keyboard__text}>
                                        9
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.keyboard__row}>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={this.handleDelete}>
                                    <Text style={styles.keyboard__text}>
                                        <FeatherIcon name='delete' size={20} color='#404040' />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('0')}>
                                    <Text style={styles.keyboard__text}>
                                        0
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.keyboard__item}>
                                <TouchableOpacity style={styles.keyboard__btn} onPress={() => this.handleInput('.')}>
                                    <Text style={styles.keyboard__text}>
                                        .
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.line} />
                    <View style={styles.qr}>
                        <View>
                            <QRCode
                                size={120}
                                value={this.state.dataForQr}
                            />
                        </View>
                    </View>
                    <TouchableOpacity onPress={this.copyToClip}>
                        <Text style={styles.address}>
                            { address }
                        </Text>
                    </TouchableOpacity>
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
    keyboard: {
        paddingHorizontal: 40
    },
    keyboard__btn: {
        justifyContent: 'center',
        alignItems: 'center',

        // width: 40,
        // height: 40
    },
    keyboard__text: {
        width: 50,
        paddingVertical: 3,

        fontSize: 25,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    keyboard__row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    keyboard__item: {

    },
    line: {
        borderBottomColor: '#8e96b5',
        borderBottomWidth: 1,
        borderStyle: 'solid'
    }
}
