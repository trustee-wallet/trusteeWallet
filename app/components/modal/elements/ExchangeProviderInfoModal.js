import React, { Component } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
} from 'react-native'

import Modal from 'react-native-modal'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import GradientView from '../../../components/elements/GradientView'

import { hideModal } from '../../../appstores/Actions/ModalActions'

import { strings } from '../../../services/i18n'


export class ExchangeProviderInfoModal extends Component {

    constructor(props){
        super(props)
        this.state = {
            min: '',
            max: ''
        }
    }

    componentWillMount() {
        this.initLimits()
    }

    initLimits = () => {

        const { paymentSystem } = this.props.data.data

        this.setState({
            min: 1 * paymentSystem.limits.min.toFixed(5),
            max: paymentSystem.limits.max == null ? '∞' : 1 * paymentSystem.limits.max.toFixed(5),
        })
    }

    handleHide = () => hideModal()

    render() {

        const { min, max } = this.state
        const { selectedInCryptocurrency } = this.props.data.data
        const { show } = this.props

        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={show}>
                <View style={styles.content}>
                    <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
                        <Text style={styles.title}>
                            { strings('exchangeScreen.providerInformation') }
                        </Text>
                        <TouchableOpacity onPress={() => this.handleHide()} style={styles.cross}>
                            <AntDesignIcon name='close' size={22} color='#fff' />
                        </TouchableOpacity>
                        <View style={styles.content__main}>
                            <View style={styles.content__row}>
                                <Text style={styles.content__text}>
                                    { strings('tradeScreen.minAmount') }
                                </Text>
                                <Text style={styles.content__text}>
                                    {`${min} ${selectedInCryptocurrency.currencySymbol}`}
                                </Text>
                            </View>
                            <View style={styles.content__row}>
                                <Text style={styles.content__text}>
                                    { strings('tradeScreen.maxAmount') }
                                </Text>
                                <Text style={styles.content__text}>
                                    {`${max} ${selectedInCryptocurrency.currencySymbol}`}
                                </Text>
                            </View>
                        </View>
                    </GradientView>
                </View>
            </Modal>
        )
    }
}

const styles_ = {
    array: ['#43156d','#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 },
}

export default ExchangeProviderInfoModal

const styles = {
    modal: {
        justifyContent: 'center',
    },
    content: {
        position: 'relative',

        borderRadius: 14,
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
    content__main: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        marginTop: 10
    },
    content__row: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        marginTop: 8
    },
    content__text: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#F3E6FF',
        fontSize: 16
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bg: {
        paddingTop: 15,

        borderRadius: 14
    },
    cross: {
        position: 'absolute',
        top: 6,
        right: 6,
        padding: 10
    },
    icon: {
        width: 230,
        height: 220,
        marginTop: 10,
        marginBottom: 10
    },
    title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 18,
        textAlign: 'center',
        color: '#f4f4f4',
    },
    subtitle: {
        marginTop: 24,
        marginBottom: 8,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#fff',
    },
    text: {
        width: '100%',
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        textAlign: 'left',
        color: '#f4f4f4',
    },
    bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 24,
        paddingBottom: 24,
    },
}