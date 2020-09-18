/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import Modal from 'react-native-modal'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import GradientView from '../../../components/elements/GradientView'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'
import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'


export class PaymentSystemInfo extends Component {

    constructor(props) {
        super(props)
        this.state = {
            title: '',
            min: '',
            max: ''
        }
    }

    UNSAFE_componentWillMount() {
        this.initTitle()
        this.initLimits()
    }

    initTitle = () => {
        const { paymentSystem } = this.props.data.data

        let title = ''

        if (paymentSystem.paymentSystem === 'VISA_MC_P2P' && paymentSystem.currencyCode === 'UAH') {
            title = strings('tradeScreen.urkCardOnly')
        } else if (paymentSystem.paymentSystem === 'VISA_MC_P2P' && paymentSystem.currencyCode === 'RUB') {
            title = strings('tradeScreen.rusCardOnly')
        } else if (paymentSystem.paymentSystem === 'QIWI') {
            title = strings('tradeScreen.QIWI')
        } else if (paymentSystem.paymentSystem === 'ADVCASH') {
            title = strings('tradeScreen.ADVCASH') + ' ' + (BlocksoftExternalSettings.getStatic('ADV_PERCENT')) + '%'
        } else if (paymentSystem.paymentSystem === 'MOBILE_PHONE') {
            title = strings(`tradeScreen.UAH`)
        } else {
            title = strings('tradeScreen.worldwideOnly')
        }

        this.setState({
            title
        })
    }

    initLimits = () => {

        const { selectedFiatCurrency, paymentSystem } = this.props.data.data

        this.setState({
            min: Math.floor(paymentSystem.limits.min) + ' ' + paymentSystem.currencyCode,
            max: Math.floor(paymentSystem.limits.max) + ' ' + paymentSystem.currencyCode
        })
    }

    handleHide = () => hideModal()

    render() {

        const { title, min, max } = this.state
        const { selectedFiatCurrency } = this.props.data.data
        const { show } = this.props

        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={show}>
                <View style={styles.content}>
                    <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
                        <Text style={styles.title}>
                            {strings('tradeScreen.paymentInformation')}
                        </Text>
                        <TouchableOpacity onPress={() => this.handleHide()} style={styles.cross}>
                            <AntDesignIcon name='close' size={22} color='#fff'/>
                        </TouchableOpacity>
                        <View style={styles.content__main}>
                            <Text style={styles.subtitle}>{title}</Text>
                            <View style={styles.content__row}>
                                <Text style={styles.content__text}>
                                    {strings('tradeScreen.minAmount')}
                                </Text>
                                <Text style={styles.content__text}>
                                    {`${min}`}
                                </Text>
                            </View>
                            <View style={styles.content__row}>
                                <Text style={styles.content__text}>
                                    {strings('tradeScreen.maxAmount')}
                                </Text>
                                <Text style={styles.content__text}>
                                    {`${max}`}
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
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

export default PaymentSystemInfo

const styles = {
    modal: {
        justifyContent: 'center'
    },
    content: {
        position: 'relative',

        borderRadius: 14,
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
    content__main: {
        paddingHorizontal: 16,
        paddingBottom: 24
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
        alignItems: 'center'
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
        color: '#f4f4f4'
    },
    subtitle: {
        marginTop: 24,
        marginBottom: 8,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#fff'
    },
    text: {
        width: '100%',
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        textAlign: 'left',
        color: '#f4f4f4'
    },
    bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 24,
        paddingBottom: 24
    }
}
