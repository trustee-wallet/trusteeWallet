/**
 * @version todo
 * @misha to review
 */
import React, { Component } from "react"

import { View } from "react-native"

import PhoneInput from "../../../components/elements/PhoneInput"

import { strings } from '../../../services/i18n'


class OptionalData extends Component {

    constructor(props) {
        super(props)
        this.state = {
            enabled: false,
            uniqueParams: {}
        }
    }

    getState = () => this.state

    disable = () => this.setState({ enabled: false })

    enable = () => this.setState({ enabled: true })

    validateData = async () => {
        const { selectedPaymentSystem, selectedCard, self } = this.props

        if(selectedPaymentSystem.paymentSystem === 'VISA_MC_P2P' && selectedPaymentSystem.currencyCode === 'RUB' && selectedPaymentSystem.provider === '365cash'){

            self.state.uniqueParams = {
                ...self.state.uniqueParams,
                cardNumber: selectedCard.number
            }

            delete self.state.uniqueParams.phone

        } else if(selectedPaymentSystem.paymentSystem === 'QIWI'){

            const refPhoneNumber = this.refPhoneNumber.validate()

            if(!refPhoneNumber){
                throw new Error(strings('tradeScreen.modalError.additionalData'))
            } else {
                self.state.uniqueParams = {
                    ...self.state.uniqueParams,
                    phone: this.refPhoneNumber.getPhoneNumber()
                }

                delete self.state.uniqueParams.cardNumber
            }
        } else if(selectedPaymentSystem.paymentSystem === 'MOBILE_PHONE'){

            const refPhoneNumber = this.refPhoneNumber.validate([380])

            if(!refPhoneNumber){
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

        const { selectedPaymentSystem, inputOnFocus } = this.props

        if(typeof selectedPaymentSystem.paymentSystem != 'undefined'){
            if(selectedPaymentSystem.paymentSystem === 'VISA_MC_P2P' && selectedPaymentSystem.currencyCode === 'RUB' && selectedPaymentSystem.provider === '365cash'){
                return <View />
            } else if(selectedPaymentSystem.paymentSystem === 'QIWI' || selectedPaymentSystem.paymentSystem === 'MOBILE_PHONE'){
                return (
                    <View>
                        <PhoneInput ref={ref => this.refPhoneNumber = ref} onFocus={inputOnFocus} />
                    </View>
                )
            } else {
                return <View />
            }
        }

        return <View />
    }

    render() {
        return this.renderOptionalData()
    }
}

export default OptionalData
