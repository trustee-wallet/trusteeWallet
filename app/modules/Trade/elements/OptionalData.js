/**
 * @version todo
 */
import React, { Component } from 'react'

import { View } from 'react-native'

import PhoneInput from '../../../components/elements/PhoneInput'
import AdvInput from '../../../components/elements/AdvInput'
import AdvEmail from '../../../components/elements/AdvEmail'
import PerfectMoneyInput from '../../../components/elements/PerfectMoneyInput'
import PayeerInput from '../../../components/elements/PayeerInput'

import { strings } from '../../../services/i18n'


class OptionalData extends Component {

    constructor(props) {
        super(props)
        this.state = {
            enabled: false,
            uniqueParams: {},
            selectedPaymentSystem: false
        }
    }

    getState = () => this.state

    disable = () => this.setState({ enabled: false })

    enable = (selectedPaymentSystem) => {
        if (typeof selectedPaymentSystem !== 'undefined' && selectedPaymentSystem) {
            this.setState({ enabled: true, selectedPaymentSystem })

        } else {
            this.setState({ enabled: true })
        }
    }

    validateData = async () => {
        const { selectedCard, self } = this.props
        const { selectedPaymentSystem } = this.state
        const { tradeType } = this.props.exchangeStore

        if (!selectedPaymentSystem) {
            return false
        }
        if (selectedPaymentSystem.paymentSystem === 'VISA_MC_P2P' && selectedPaymentSystem.currencyCode === 'RUB' && selectedPaymentSystem.provider === '365cash') {

            self.state.uniqueParams = {
                ...self.state.uniqueParams,
                cardNumber: selectedCard.number
            }

            delete self.state.uniqueParams.phone

        } else if (selectedPaymentSystem.paymentSystem === 'QIWI') {

            const refPhoneNumber = this.refPhoneNumber.validate()

            if (!refPhoneNumber) {
                throw new Error(strings('tradeScreen.modalError.additionalData'))
            } else {
                self.state.uniqueParams = {
                    ...self.state.uniqueParams,
                    phone: this.refPhoneNumber.getPhoneNumber()
                }

                delete self.state.uniqueParams.cardNumber
            }
        } else if (selectedPaymentSystem.paymentSystem === 'ADVCASH') {
            if (tradeType === 'BUY') {
                // do nothing
            } else {
                const refPhoneNumber = this.refPhoneNumber.validate()
                const refEmail = typeof this.refEmail !== 'undefined' ? this.refEmail.validate() : false

                if (!refPhoneNumber || !refEmail) {
                    throw new Error(strings('tradeScreen.modalError.additionalData'))
                } else {
                    self.state.uniqueParams = {
                        ...self.state.uniqueParams,
                        wallet: this.refPhoneNumber.getWalletNumber(),
                        email: this.refEmail.getEmail()
                    }

                    delete self.state.uniqueParams.cardNumber
                }
            }
        } else if (selectedPaymentSystem.paymentSystem === 'PAYEER' || selectedPaymentSystem.paymentSystem === 'PERFECT_MONEY') {
            if (tradeType === 'BUY') {
                // do nothing
            } else {
                const refPhoneNumber = this.refPhoneNumber.validate()
                if (!refPhoneNumber) {
                    throw new Error(strings('tradeScreen.modalError.additionalData'))
                } else {
                    self.state.uniqueParams = {
                        ...self.state.uniqueParams,
                        wallet: this.refPhoneNumber.getWalletNumber(),
                    }

                    delete self.state.uniqueParams.cardNumber
                }
            }
        } else if (selectedPaymentSystem.paymentSystem === 'MOBILE_PHONE') {

            const refPhoneNumber = this.refPhoneNumber.validate([380])

            if (!refPhoneNumber) {
                throw new Error(strings('tradeScreen.modalError.additionalData'))
            } else {
                self.state.uniqueParams = {
                    ...self.state.uniqueParams,
                    phone: this.refPhoneNumber.getPhoneNumber()
                }

                delete self.state.uniqueParams.cardNumber
            }
        }
    }

    renderOptionalData = () => {

        const { inputOnFocus } = this.props
        const { tradeType, advEmail, advWallet, perfectWallet, payeerWallet } = this.props.exchangeStore
        const { selectedPaymentSystem, enabled } = this.state


        if (!selectedPaymentSystem || typeof selectedPaymentSystem.paymentSystem === 'undefined' || !enabled) {
            return <View/>
        }

        if (selectedPaymentSystem.paymentSystem === 'ADVCASH') {
            if (tradeType === 'BUY') {
                return <View/>
            } else {
                return (
                    <View>
                        <AdvInput ref={ref => this.refPhoneNumber = ref} value={advWallet} onFocus={inputOnFocus}/>
                        <AdvEmail ref={ref => this.refEmail = ref} value={advEmail} onFocus={inputOnFocus}/>
                    </View>
                )
            }
        } else if (selectedPaymentSystem.paymentSystem === 'PAYEER') {
            if (tradeType === 'BUY') {
                return <View/>
            } else {
                return (
                    <View>
                        <PayeerInput ref={ref => this.refPhoneNumber = ref} value={payeerWallet} onFocus={inputOnFocus}/>
                    </View>
                )
            }
        }
        if (selectedPaymentSystem.paymentSystem === 'PERFECT_MONEY') {
            if (tradeType === 'BUY') {
                return <View/>
            } else {
                return (
                    <View>
                        <PerfectMoneyInput ref={ref => this.refPhoneNumber = ref} value={perfectWallet} onFocus={inputOnFocus}/>
                    </View>
                )
            }
        } else if (selectedPaymentSystem.paymentSystem === 'VISA_MC_P2P' && selectedPaymentSystem.currencyCode === 'RUB' && selectedPaymentSystem.provider === '365cash') {
            return <View/>
        } else if (selectedPaymentSystem.paymentSystem === 'QIWI' || selectedPaymentSystem.paymentSystem === 'MOBILE_PHONE') {
            return (
                <View>
                    <PhoneInput ref={ref => this.refPhoneNumber = ref} onFocus={inputOnFocus}/>
                </View>
            )
        } else {
            return <View/>
        }

    }

    render() {
        return this.renderOptionalData()
    }
}

export default OptionalData
