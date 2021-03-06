/**
 * @version 0.41
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { HIT_SLOP } from '@app/themes/Themes'
import AmountInput from '@app/modules/Send/elements/InputAndButtonsInput'
import CustomIcon from '@app/components/elements/CustomIcon'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { getSendScreenData } from '@app/appstores/Stores/Send/selectors'

import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'


const amountInput = {
    id: 'value',
    type: 'AMOUNT',
    additional: 'NUMBER',
    mark: 'ETH'
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class InputAndButtons extends Component {

    constructor(props) {
        super(props)
        this.state = {
            inputType : this.props.sendScreenStore.ui.inputType,
            inputValue : '',
            equivalentValue : '0.00',
            cryptoValue : '',
            partBalance : 0,
            isCounting : false
        }
        this.valueInput = React.createRef()
    }

    handleChangeEquivalentType = () => {
        const inputType = this.state.inputType === 'CRYPTO' ? 'FIAT' : 'CRYPTO'
        SendActionsStart.setBasicInputType(inputType)
        const equivalentValue = this.state.equivalentValue
        this.setState({
            inputType,
            inputValue: equivalentValue,
            equivalentValue : this.state.inputValue ? this.state.inputValue : '0.00'
        })
        this.valueInput.handleInput(BlocksoftPrettyNumbers.makeCut(equivalentValue).separated, false)
    }

    handlePartBalance = (newPartBalance) => {
        // if newPartBalance = 4 = 100%
        this.setState({
            partBalance : newPartBalance,
            isCounting : true
        })
        this.handlePartBalanceFinish()
    }

    handlePartBalanceFinish = async () => {
        await SendActionsBlockchainWrapper.getTransferAllBalance()
        this.setState({
            isCounting : false
        })
    }

    amountInputCallback = async (value) => {
        if (!value || value === '' || value === '0' || value === '0.00') {
            this.setState({
                equivalentValue : '0.00',
                cryptoValue : 0,
                partBalance : 0
            })
        } else {
            const { currencyCode, basicCurrencyRate } = this.props.sendScreenStore.dict
            let equivalentValue, cryptoValue
            if (this.state.inputType === 'CRYPTO') {
                equivalentValue = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                cryptoValue = value
            } else {
                equivalentValue = RateEquivalent.div({ value, currencyCode, basicCurrencyRate })
                cryptoValue = equivalentValue
            }
            this.setState({
                inputValue: value,
                equivalentValue,
                cryptoValue,
                partBalance : 0
            })
        }
    }

    render() {
        console.log('SendScreen.inputAndButtons render', JSON.stringify(this.props))

        const { colors, GRID_SIZE } = this.context
        const { decimals, currencySymbol, basicCurrencyCode, balanceTotalPretty } = this.props.sendScreenStore.dict
        const { inputType, equivalentValue } = this.state


        const notEquivalentValue = '~ ' + BlocksoftPrettyNumbers.makeCut(equivalentValue).separated + ' ' + (inputType !== 'CRYPTO' ? currencySymbol : basicCurrencyCode)
        return (
            <View>
                <View style={{ width: '75%', alignSelf: 'center', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <AmountInput
                            ref={component => this.valueInput = component}
                            // onFocus={() => this.onFocus()}
                            decimals={decimals < 10 ? decimals : 10}
                            enoughFunds={true} //!this.state.enoughFunds.isAvailable}
                            id={amountInput.id}
                            additional={amountInput.additional}
                            type={amountInput.type}
                            callback={(value) => this.amountInputCallback(value, true)}
                            maxLength={17}
                            maxWidth={SCREEN_WIDTH * 0.6}
                        />
                        <Text style={{ ...style.ticker, color: colors.sendScreen.amount }}>
                            {inputType === 'CRYPTO' ? currencySymbol : basicCurrencyCode}
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <View style={{ ...style.line, backgroundColor: colors.sendScreen.colorLine }} />
                    <TouchableOpacity style={{ position: 'absolute', right: 10, marginTop: -4 }}
                                      onPress={this.handleChangeEquivalentType} hitSlop={HIT_SLOP}>
                        <CustomIcon name={'changeCurrency'} color={colors.common.text3} size={20} />
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <LetterSpacing text={this.state.isCounting ? 'Loading...' : notEquivalentValue} textStyle={{ ...style.notEquivalentValue, color: '#999999' }}
                                   letterSpacing={1.5} />
                </View>
                { balanceTotalPretty > 0  && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: GRID_SIZE }}>
                        <InputAndButtonsPartBalanceButton
                            action={() => {
                                this.handlePartBalance(1)

                                this.setState({
                                    partBalance: 1,
                                    useAllFunds: false
                                })
                            }}
                            text={'25%'}
                            inverse={this.state.partBalance === 1}
                        />
                        <InputAndButtonsPartBalanceButton
                            action={() => {
                                this.handlePartBalance(2)
                            }}
                            text={'50%'}
                            inverse={this.state.partBalance === 2}
                        />
                        <InputAndButtonsPartBalanceButton
                            action={() => {
                                this.handlePartBalance(3)
                            }}
                            text={'75%'}
                            inverse={this.state.partBalance === 3}
                        />
                        <InputAndButtonsPartBalanceButton
                            action={() => {
                                this.handlePartBalance(4)
                            }}
                            text={'100%'}
                            inverse={this.state.partBalance === 4}
                        />
                    </View>
                )}
            </View>
        )
    }
}

InputAndButtons.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        sendScreenStore: getSendScreenData(state)
    }
}

export default connect(mapStateToProps, {})(InputAndButtons)

const style = StyleSheet.create({
    ticker: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 15,
        lineHeight: 19,

        alignSelf: 'flex-end',
        marginBottom: 8,
        paddingLeft: 6
    },
    line: {
        height: 1,
        width: '75%',
        alignSelf: 'center',
        marginVertical: 6
    },
    notEquivalentValue: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19
    },
})
