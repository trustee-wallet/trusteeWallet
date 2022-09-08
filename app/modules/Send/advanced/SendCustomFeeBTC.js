/**
 * @version 0.41
 */
import React from 'react'

import { View, Text, StyleSheet } from 'react-native'

import { strings } from '@app/services/i18n'

import FeeForByteInput from '@app/components/elements/NewInput'

import { ThemeContext } from '@app/theme/ThemeProvider'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'

class SendCustomFeeBTC extends React.PureComponent {

    constructor(props) {
        super(props)

        this.state = {
            feeForTxCalculated: 0,
            feeForByteCalculated: 0,
            isFeeCalculated: false
        }
        this.feeForByteInput = React.createRef()
    }

    componentDidMount() {
        const currentSelectedFee = this.props.currentSelectedFee
        const {feeForByte} = currentSelectedFee
        if (feeForByte && typeof feeForByte !== 'undefined') {
            this.feeForByteInput.handleInput(feeForByte.toString(), false)
            this.setState({
                feeForTxCalculated: currentSelectedFee.feeForTx,
                feeForByteCalculated: currentSelectedFee.feeForByte,
                isFeeCalculated: true
            })
        }
    }

    handleRecount = async (value) => {

        if (value !== 0 && value !== '') {
            this._actualRecount(value)
        }

        return true
    }

    _actualRecount = async (_feeForByte) => {
        const newIsCalculated = _feeForByte === this.state.feeForByteCalculated
        if (this.state.isFeeCalculated !== newIsCalculated) {
            this.setState({
                isFeeCalculated: newIsCalculated
            })
        }

        const item = {feeForByte : _feeForByte, isCustomFee : true}
        SendActionsUpdateValues.setTmpSelectedFee(item)
    }

    render() {

        const { colors, GRID_SIZE } = this.context

        let customFee = ''
        if (this.state.isFeeCalculated && this.state.feeForTxCalculated) {
            const { feesBasicCurrencyRate, feesBasicCurrencySymbol, feesCurrencySymbol, feesCurrencyCode, currencySymbol, currencyCode } = this.props.sendScreenStore.dict
            const feesPretty = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode || currencyCode).makePretty(this.state.feeForTxCalculated)
            let fiatFee = RateEquivalent.mul({ value: feesPretty, currencyCode: feesCurrencyCode || currencyCode, basicCurrencyRate: feesBasicCurrencyRate })
            if (Number(fiatFee) < 0.01) {
                fiatFee = `< ${feesBasicCurrencySymbol} 0.01`
            } else {
                fiatFee = `${feesBasicCurrencySymbol} ${BlocksoftPrettyNumbers.makeCut(fiatFee).justCutted}`
            }
            customFee = strings(`send.fee.customFee.calculatedFee`) + `\n${feesPretty} ${feesCurrencySymbol || currencySymbol} / ${fiatFee} `
        } else {
            customFee = strings(`send.fee.customFee.calculatedFee`) + ' ... '
        }

        return (
            <View style={{ marginTop: 10, paddingHorizontal: GRID_SIZE }}>
                <View>
                    <Text style={{ ...styles.customFee, color: colors.common.text1 }}>{customFee}</Text>
                </View>
                <View style={{ paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <Text style={{ ...styles.customFee, color: colors.common.text1 }}>{strings(`send.fee.customFee.btc.feeForByte`)}</Text>
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

SendCustomFeeBTC.contextType = ThemeContext

export default SendCustomFeeBTC

const styles = StyleSheet.create({
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
        }
    },
    customFee: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        paddingBottom: 4
    }
})
