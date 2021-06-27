/**
 * @version 0.41
 */
import React, { PureComponent } from 'react'
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { HIT_SLOP } from '@app/themes/HitSlop'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { strings } from '@app/services/i18n'

import InputAndButtonsInput from '@app/modules/Send/elements/InputAndButtonsInput'
import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'

import CustomIcon from '@app/components/elements/CustomIcon'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftDict from '@crypto/common/BlocksoftDict'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'

import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'


import Log from '@app/services/Log/Log'
import config from '@app/config/config'
import DaemonCache from '@app/daemons/DaemonCache'

const amountInput = {
    id: 'value',
    type: 'AMOUNT',
    additional: 'NUMBER',
    mark: 'ETH'
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const USDT_LIMIT = 600

class InputAndButtons extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            inputType: this.props.sendScreenStoreDict.inputType,
            inputValue: '',
            equivalentValue: '0.00',
            cryptoValue: '',
            cryptoValueRecounted: '0',
            partBalance: 0,
            isCountingTransferAll: false,
            enoughFunds: {
                isAvailable: true,
                messages: []
            }
        }
        this.valueInput = React.createRef()
    }

    componentDidMount() {
        if (!this.valueInput || typeof this.valueInput.handleInput === 'undefined') return
        this._setCryptoValue(this.props.sendScreenStoreUi.cryptoValue, this.props.sendScreenStoreDict.inputType)
    }

    componentDidUpdate(prevProps) {
        if (this.valueInput && prevProps.sendScreenStoreUi.cryptoValue !== this.props.sendScreenStoreUi.cryptoValue) {
            this._setCryptoValue(this.props.sendScreenStoreUi.cryptoValue, this.props.sendScreenStoreDict.inputType)
        }
    }

    _checkInputCallback = () => {
        if (!this.valueInput || typeof this.valueInput.handleInput === 'undefined') return

        const { cryptoValueRecounted, cryptoValue } = this.props.sendScreenStoreUi
        if (typeof cryptoValue === 'undefined') return
        if (typeof cryptoValueRecounted === 'undefined' || cryptoValueRecounted === 0) return
        if (cryptoValueRecounted === this.state.cryptoValueRecounted) return
        if (cryptoValue === this.state.cryptoValue) return

        this._setCryptoValue(cryptoValue, this.props.sendScreenStoreDict.inputType, cryptoValueRecounted)

    }

    handleChangeEquivalentType = () => {
        const inputType = this.state.inputType === 'CRYPTO' ? 'FIAT' : 'CRYPTO'
        SendActionsStart.setBasicInputType(inputType)
        const equivalentValue = this.state.equivalentValue && this.state.equivalentValue > 0 ? this.state.equivalentValue : ''
        const inputValue = this.state.inputValue && this.state.inputValue > 0 ? this.state.inputValue : ''
        this.setState({
            inputType,
            inputValue: equivalentValue,
            equivalentValue: inputValue
        })

        if (equivalentValue && equivalentValue > 0) {
            this.valueInput.handleInput(BlocksoftPrettyNumbers.makeCut(equivalentValue).separated, false)
        }
    }

    handlePartBalance = (newPartBalance) => {
        // if newPartBalance = 4 = 100%
        Log.log('Input.handlePartBalance ' + newPartBalance + ' clicked')
        this.setState({
            partBalance: newPartBalance,
            isCountingTransferAll: true
        }, async () => {
            Log.log('Input.handlePartBalance ' + newPartBalance + ' start counting')
            const res = await SendActionsBlockchainWrapper.getTransferAllBalance()
            const val = this.transferAllCallback(res.transferAllBalance)
            Log.log('Input.handlePartBalance ' + newPartBalance + ' end counting ' + val + ' with res ' + JSON.stringify(res))
        })

    }

    transferAllCallback = (transferAllBalance) => {
        const { currencyCode } = this.props.sendScreenStoreDict
        let cryptoValue
        if (this.state.partBalance === 4 || transferAllBalance === 0) {
            cryptoValue = transferAllBalance
        } else {
            cryptoValue = BlocksoftUtils.mul(BlocksoftUtils.div(transferAllBalance, 4), this.state.partBalance)
        }
        if (currencyCode !== 'USDT' && currencyCode !== 'XRP' && currencyCode !== 'XLM') {
            cryptoValue = BlocksoftUtils.round(cryptoValue)
        }

        this._setCryptoValue(cryptoValue, this.state.inputType)
        return cryptoValue
    }

    _setCryptoValue = (cryptoValue, inputType, cryptoValueRecounted = false) => {
        const { currencyCode, basicCurrencyRate } = this.props.sendScreenStoreDict

        const cryptoPrettyValue = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(cryptoValue)
        const fiatPrettyValue = RateEquivalent.mul({ value: cryptoPrettyValue, currencyCode, basicCurrencyRate })
        const toUpdate = {
            isCountingTransferAll: false,
            inputValue: '',
            inputType,
            equivalentValue: fiatPrettyValue,
            cryptoValue,
            enoughFunds: {
                isAvailable: true,
                messages: ''
            }
        }
        if (inputType === 'CRYPTO') {
            toUpdate.inputValue = cryptoPrettyValue
            toUpdate.equivalentValue = fiatPrettyValue > 0 ? fiatPrettyValue : '0.00'
        } else {
            toUpdate.inputValue = fiatPrettyValue
            toUpdate.equivalentValue = cryptoPrettyValue > 0 ? cryptoPrettyValue : '0.00'
        }
        if (cryptoValueRecounted) {
            toUpdate.cryptoValueRecounted = cryptoValueRecounted
        }
        this.setState(toUpdate)
        if (toUpdate.inputValue > 0) {
            this.valueInput.handleInput(BlocksoftPrettyNumbers.makeCut(toUpdate.inputValue).separated, false)
        }
    }

    amountInputCallback = async (value) => {
        if (!value || value === '' || value === '0' || value === '0.00') {
            this.setState({
                equivalentValue: '0.00',
                partBalance: 0
            })
        } else {
            const { currencyCode, basicCurrencyRate } = this.props.sendScreenStoreDict
            let equivalentValue, cryptoValue
            if (this.state.inputType === 'CRYPTO') {
                equivalentValue = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                cryptoValue = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(value)
            } else {
                equivalentValue = RateEquivalent.div({ value, currencyCode, basicCurrencyRate })
                cryptoValue = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(equivalentValue)
            }
            this.setState({
                inputValue: value,
                equivalentValue,
                partBalance: 0,
                cryptoValue
            })
        }
    }

    async disabledGotoWhy() {
        const msg = await this._disabledGotoWhy()
        if (msg) {
            this.setState({
                enoughFunds: {
                    isAvailable: false,
                    messages: [msg]
                }
            })
            return {
                status: 'fail',
                value: 0
            }
        }
        if (!this.state.enoughFunds.isAvailable) {
            this.setState({
                enoughFunds: {
                    isAvailable: true,
                    messages: ''
                }
            })
        }
        return {
            status: 'success',
            value: this.state.cryptoValue,
            isTransferAll: this.state.partBalance === 4
        }
    }

    async _disabledGotoWhy() {
        const { balanceTotalPretty, balanceRaw, currencyCode, walletHash, addressFrom } = this.props.sendScreenStoreDict

        if (this.state.isCountingTransferAll) {
            return 'Loading...'
        }

        if (balanceTotalPretty <= 0) {
            return strings('send.notEnough')
        }

        if (typeof this.valueInput.state === 'undefined' || this.valueInput.state.value === '' || this.valueInput.state.value === '0') {
            return strings('send.notValidAmount')
        }

        if (this.state.cryptoValue === '000000000' || this.state.cryptoValue === 0) {
            if (this.state.inputType === 'CRYPTO') {
                return strings('send.notValidAmount')
            } else {
                return strings('send.notValidAmountInFiat')
            }
        }

        // enough balance check
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        if (typeof extend.delegatedTransfer === 'undefined' && typeof extend.feesCurrencyCode !== 'undefined' && typeof extend.skipParentBalanceCheck === 'undefined') {
            const parentCurrency = await DaemonCache.getCacheAccount(walletHash, extend.feesCurrencyCode)
            if (parentCurrency) {
                let msg = false
                const parentBalance = parentCurrency.balance * 1
                let symbol = ''
                if (extend.feesCurrencyCode === 'BNB_SMART') {
                    symbol = 'BNB Smart Chain'
                } else {
                    const parentSettings = BlocksoftDict.getCurrencyAllSettings(extend.feesCurrencyCode)
                    symbol = parentCurrency.currencySymbol || parentSettings.currencySymbol
                }
                if (currencyCode === 'USDT' && parentBalance < USDT_LIMIT) {
                    if (typeof parentCurrency.unconfirmed !== 'undefined' && parentCurrency.unconfirmed * 1 >= USDT_LIMIT) {
                        // @todo mark to turn on unconfirmed
                        // msg = strings('send.errors.SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT_WAIT_FOR_CONFIRM', { symbol: extend.addressCurrencyCode })
                    } else {
                        msg = strings('send.errors.SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT', { symbol })
                    }
                } else if (parentBalance === 0) {
                    if (typeof parentCurrency.unconfirmed !== 'undefined' && parentCurrency.unconfirmed > 0) {
                        msg = strings('send.notEnoughForFeeConfirmed', { symbol })
                    } else {
                        msg = strings('send.notEnoughForFee', { symbol })
                    }
                }
                if (msg) {
                    Log.log('Send.SendScreen.handleSendTransaction ' + currencyCode + ' from ' + addressFrom + ' parentBalance ' + extend.feesCurrencyCode + ' ' + symbol + ' not ok ' + parentBalance, parentCurrency)
                    if (config.debug.appErrors) {
                        console.log('Send.SendScreen.handleSendTransaction ' + currencyCode + ' from ' + addressFrom + ' parentBalance ' + extend.feesCurrencyCode + ' ' + symbol + ' not ok ' + parentBalance, parentCurrency)
                    }
                    return msg
                }
            }
        }

        let diff = BlocksoftUtils.diff(this.state.cryptoValue, balanceRaw)
        const hodl = await (BlocksoftBalances.setCurrencyCode(currencyCode)).getBalanceHodl()
        if (hodl * 1 > 0) {
            diff = BlocksoftUtils.add(diff, hodl)
        }
        if (diff * 1 > 0) {
            return strings('send.notEnough')
        }
        return false
    }

    renderEnoughFundsError = () => {
        const { enoughFunds } = this.state

        const { colors, GRID_SIZE } = this.context

        if (enoughFunds.isAvailable) return

        return (
            <View style={{ marginTop: GRID_SIZE }}>
                {
                    enoughFunds.messages.map((item, index) => {
                        return (
                            <View key={index} style={style.texts}>
                                <View style={style.texts__icon}>
                                    <Icon
                                        name='information-outline'
                                        size={22}
                                        color='#864DD9'
                                    />
                                </View>
                                <View>
                                    <TouchableOpacity delayLongPress={500} onLongPress={() => this.handleOkForce()}>
                                        <Text style={{ ...style.texts__item, color: colors.common.text3 }}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )
                    })
                }
            </View>
        )

    }

    render() {
        const { colors, GRID_SIZE } = this.context
        const { decimals, currencySymbol, basicCurrencyCode, balanceTotalPretty } = this.props.sendScreenStoreDict
        let { inputType, equivalentValue } = this.state

        if (this.state.isCountingTransferAll && this.props.sendScreenStoreTransferAllBalance) {
            this.transferAllCallback(this.props.sendScreenStoreTransferAllBalance)
        } else {
            this._checkInputCallback()
        }

        if (equivalentValue && equivalentValue > 0) {
            equivalentValue = BlocksoftPrettyNumbers.makeCut(equivalentValue).separated
        } else {
            equivalentValue = '0.00'
        }


        const lastScan = this.props.sendScreenStoreDict.currencyRateScanTime
        const timeNow = new Date().getTime()
        const diffTime = Math.round((timeNow - lastScan) / 60000)
        
        let diffTimeText = ''
        if (diffTime > 2 && this.props.sendScreenStoreDict.basicCurrencyRate) {
            diffTimeText = strings('account.minutesAgo', {time : diffTime})
        }

        const notEquivalentValue = `~ ${equivalentValue} ${inputType !== 'CRYPTO' ? currencySymbol : basicCurrencyCode} ${diffTimeText} `

        return (
            <View>
                <View style={{ width: '75%', alignSelf: 'center', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <InputAndButtonsInput
                            ref={component => this.valueInput = component}
                            // onFocus={() => this.onFocus()}
                            decimals={inputType === 'CRYPTO' ? decimals : 5}
                            enoughFunds={!this.state.enoughFunds.isAvailable}
                            id={amountInput.id}
                            additional={amountInput.additional}
                            type={amountInput.type}
                            callback={(value) => {
                                this.amountInputCallback(value, true)
                                this.setState({
                                    enoughFunds: {
                                        isAvailable: true,
                                        messages: ''
                                    }
                                })
                            }}
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
                    <LetterSpacing text={this.state.isCountingTransferAll ? 'Loading...' : notEquivalentValue} textStyle={{ ...style.notEquivalentValue, color: '#999999' }}
                        letterSpacing={1.5} />
                </View>
                {balanceTotalPretty > 0 && (
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

                {this.renderEnoughFundsError()}

            </View>
        )
    }
}

InputAndButtons.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(InputAndButtons)

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
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    }
})
