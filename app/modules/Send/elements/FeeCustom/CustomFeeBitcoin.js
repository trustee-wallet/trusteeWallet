/**
 * @version 0.1
 */
import React, { Component } from 'react'

import { Text, View } from 'react-native'

import FeeForByteInput from '../../../../components/elements/NewInput'

import { strings } from '../../../../services/i18n'

import { ThemeContext } from '../../../../modules/theme/ThemeProvider'
import BlocksoftPrettyNumbers from '../../../../../crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '../../../../services/UI/RateEquivalent/RateEquivalent'
import { BlocksoftTransfer } from '../../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'

class CustomFee extends Component {

    constructor(props) {
        super(props)

        this.state = {
            countedFees : false,
            selectedFee : {
                feeForByte : '?'
            },
            prettyFee: '',
            feeBasicAmount: ''
        }

        this.feeForByteInput = React.createRef()
    }

    componentDidMount() {
        if (typeof this.props.selectedFee.feeForByte !== 'undefined') {
            const selectedFee = this.props.selectedFee
            this._setSelectedFee(selectedFee, this.props.countedFees)
            this.feeForByteInput.handleInput(selectedFee.feeForByte.toString(), false)
        } else {
            console.log('!!!! SHOULD NOT OPEN WITHOUT ANY FEE !!!!')
        }
    }

    handleRecount = async (value) => {
        const feeForByte = Math.round(value * 1)
        if (feeForByte === 0) {
            return false
        }
        // can be loader here
        const countedFeesData = this.props.countedFeesData
        const addData = {
            feeForByte
        }

        const selectedFee = this.state.selectedFee
        if (typeof selectedFee !== 'undefined' && selectedFee && typeof selectedFee.blockchainData !== 'undefined' && typeof selectedFee.blockchainData.unspents !== 'undefined') {
            // @ts-ignore
            if (selectedFee.blockchainData.isTransferAll === countedFeesData.isTransferAll) {
                addData.unspents = selectedFee.blockchainData.unspents
            }
        }
        if (typeof countedFeesData.addressTo === 'undefined' || !countedFeesData.addressTo || countedFeesData.addressTo === '') {
            return false
        }
        const countedFees = await BlocksoftTransfer.getFeeRate(countedFeesData, addData)
        if (countedFees && countedFees.selectedFeeIndex > -1) {
            const selectedFee = countedFees.fees[countedFees.selectedFeeIndex]
            this._setSelectedFee(selectedFee)
            this.props.updateSelectedFeeBack(selectedFee)
        }
    }

    _setSelectedFee(selectedFee, countedFees = false) {
        const currencyCode = this.props.feesCurrencyCode || this.props.currencyCode
        const prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(selectedFee.feeForTx)
        const feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
            value: prettyFee,
            currencyCode: currencyCode,
            basicCurrencyRate: this.props.basicCurrencyRate
        }), 5).justCutted

        const toState = {
            selectedFee: selectedFee,
            prettyFee,
            feeBasicAmount,
        }

        if (typeof countedFees !== 'undefined' && countedFees) {
            toState.countedFees = countedFees
        }
        this.setState(toState)
    }

    render() {

        const { colors, GRID_SIZE } = this.context

        const prettyFeeSymbol = this.props.feesCurrencyCode || this.props.currencyCode
        const customFee = strings(`send.fee.customFee.calculetedFee`) + `\n${this.state.prettyFee} ${prettyFeeSymbol} / ` + (Number(this.state.feeBasicAmount) < 0.01 ? ` < ${this.props.basicCurrencySymbol} 0.01` : `${this.props.basicCurrencySymbol} ${this.state.feeBasicAmount}`)
        // ${this.state.selectedFee.feeForByte} SAT :

        return (
            <View style={{ marginTop: 10 }}>
                <View>
                    <Text style={{...styles.customFee, color: colors.common.text1}} >{ customFee }</Text>
                </View>
                <View style={{ paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <Text style={{...styles.customFee, color: colors.common.text1}} >{strings(`send.fee.customFee.btc.feeForByte`)}</Text>
                </View>
                <View style={{ ...styles.inputWrapper, marginBottom: GRID_SIZE * 1.5 }}>
                    <FeeForByteInput
                        ref={component => this.feeForByteInput = component}
                        id={'feeForByte'}
                        name={strings(`send.fee.customFee.btc.feeForByte`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        placeholer={strings(`send.fee.customFee.btc.satoshi`)}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                        callback={(value) => this.handleRecount(value)}
                        onFocus={this.props.onFocus}
                    />
                </View>
            </View>
        )
    }
}

CustomFee.contextType = ThemeContext

export default CustomFee

const styles = {
    inputWrapper: {
        justifyContent: 'center',
        borderRadius: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    },
    customFee: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        paddingBottom: 4
    }
}
