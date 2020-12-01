/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { Text, TouchableOpacity, View } from 'react-native'

import FeeForByteInput from '../../../../components/elements/Input'
import FeeForTxInput from '../../../../components/elements/Input'

import { strings } from '../../../../services/i18n'
import BlocksoftUtils from '../../../../../crypto/common/BlocksoftUtils'
import AntDesing from 'react-native-vector-icons/AntDesign'
import Theme from '../../../../themes/Themes'
import LetterSpacing from '../../../../components/elements/LetterSpacing'
import { BlocksoftTransfer } from '../../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import { add } from 'react-native-reanimated'
import BlocksoftPrettyNumbers from '../../../../../crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '../../../../services/UI/RateEquivalent/RateEquivalent'
import { showModal } from '../../../../appstores/Stores/Modal/ModalActions'

let styles

class CustomFee extends Component {

    constructor(props) {
        super(props)
        this.feeForByteInput = React.createRef()

        this.state = {
            countedFee : false,
            prettyFee: '',
            feeBasicAmount: ''
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        styles = Theme.getStyles().sendScreenStyles.confirmModalStyles
    }

    componentDidMount() {
        this.feeForByteInput.handleInput(this.props.fee.feeForByte.toString(), false)

        if (typeof this.props.fee.feeForTx !== 'undefined') {
            const currencyCode = this.props.feesCurrencyCode || this.props.currencyCode
            const prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(this.props.fee.feeForTx)
            const feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                value: prettyFee,
                currencyCode: currencyCode,
                basicCurrencyRate: this.props.basicCurrencyRate
            }), 5).justCutted

            this.setState({
                countedFee: this.props.fee,
                prettyFee,
                feeBasicAmount,
            })
        }
    }

    /**
     *
     * @param {object} nextProps
     */
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (Object.keys(nextProps.fee).length !== 0 && (JSON.stringify(nextProps.fee) !== JSON.stringify(this.props.fee))) {
            this.feeForByteInput.handleInput(nextProps.fee.feeForByte.toString(), false)

            if (typeof nextProps.fee.feeForTx !== 'undefined') {
                const currencyCode = this.props.feesCurrencyCode || this.props.currencyCode
                const prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(nextProps.fee.feeForTx)
                const feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                    value: prettyFee,
                    currencyCode: currencyCode,
                    basicCurrencyRate: this.props.basicCurrencyRate
                }), 5).justCutted

                this.setState({
                    countedFee: nextProps.fee,
                    prettyFee,
                    feeBasicAmount,
                })
            }
        }
    }

    handleFeeForByteInput = (feeForByte) => {
        // do nothing
    }

    handleFeeForTxCalc = async () => {
        const feeForByteInputValidate = await this.feeForByteInput.handleValidate()

        let feeForByte = 0
        if (feeForByteInputValidate.status === 'success') {
            feeForByte = feeForByteInputValidate.value * 1
        }
        if (feeForByte === 0) {
            return false
        }
        // can be loader here
        const feesCountedForData = this.props.countedFees.feesCountedForData
        const addData = {
            unspents : this.props.fee.blockchainData.unspents,
            feeForByte
        }
        const countedFees = await BlocksoftTransfer.getFeeRate(feesCountedForData, addData)
        if (countedFees && countedFees.selectedFeeIndex > -1) {
            const fee = countedFees.fees[countedFees.selectedFeeIndex]
            const currencyCode = this.props.feesCurrencyCode || this.props.currencyCode
            const prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(fee.feeForTx)
            const feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                value: prettyFee,
                currencyCode: currencyCode,
                basicCurrencyRate: this.props.basicCurrencyRate
            }), 5).justCutted

            this.setState({
                countedFee: fee,
                prettyFee,
                feeBasicAmount,
            })
            this.feeForByteInput.handleInput(fee.feeForByte.toString(), false)

            this.props.callTransferAll({
                feeForTx : fee.feeForTx,
                amountForTx: fee.amountForTx
            })
        }
    }

    getCustomFee = async () => {
        const feeForByteInputValidate = await this.feeForByteInput.handleValidate()

        let feeForByte = 0
        if (feeForByteInputValidate.status === 'success') {
            feeForByte = feeForByteInputValidate.value * 1
        }
        if (feeForByte === 0 || this.state.countedFee.feeForByte !== feeForByte) {
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.exchange.sorry'),
                description: strings('send.errors.UI_CALCULATE_CUSTOM_FEE')
            })
            throw new Error('Calculate total fee before send')
        }
        const { countedFee } = this.state
        countedFee.isCustomFee = true
        return countedFee
    }

    render() {
        const { prettyFee, feeBasicAmount } = this.state
        const prettyFeeSymbol = this.props.feesCurrencyCode || this.props.currencyCode
        const basicCurrencySymbol = this.props.basicCurrencySymbol
        const feeForByte = this.state.countedFee.feeForByte

        return (
            <View>
                <TouchableOpacity
                    style={styles.fee__item}>
                    <View style={styles.fee__item__content}>
                        <View style={styles.fee__item__top}>
                            <Text style={{
                                ...styles.fee__item__title,
                                color: '#efa1ae'
                            }}>
                                {strings(`send.fee.customFeeCalculated`, { symbol: prettyFeeSymbol })} {feeForByte} SAT
                            </Text>
                        </View>
                        <Text style={{
                            ...styles.fee__item__top__text,
                            color: '#efa1ae'
                        }}>
                            {prettyFee} {prettyFeeSymbol} ({basicCurrencySymbol} {feeBasicAmount})
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={{paddingTop:10}}>
                    <View style={stylesBtn.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                            <FeeForByteInput
                                ref={component => this.feeForByteInput = component}
                                id={'feeForByte'}
                                name={strings(`send.fee.customFee.btc.feeForByte`)}
                                type={'EMPTY'}
                                additional={'NUMBER'}
                                mark={strings(`send.fee.customFee.btc.satoshi`)}
                                keyboardType={'numeric'}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                markStyle={{ color: '#f4f4f4' }}
                                tintColor={'#f4f4f4'}
                                callback={(feeForTx) => this.handleFeeForByteInput(feeForTx)}/>
                        </View>
                        <View style={{ flex: 1, paddingLeft: 5, paddingRight: 15 }}>
                            <TouchableOpacity style={[stylesBtn.btn]} onPress={() => this.handleFeeForTxCalc()}>
                                <LetterSpacing text={'Calculate'}
                                               textStyle={{ ...stylesBtn.btn__text }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}

export default CustomFee

const styles_ = {
    array: ['#300f4d', '#300f4d'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const stylesActive = {
    array: ['#b95f94', '#eba0ae'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const stylesBtn = {

    settings__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },

    btn: {
        alignItems: 'center',

        padding: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,

        backgroundColor: '#fff',
        borderRadius: 10
    },
    btn__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9'
    }
}
