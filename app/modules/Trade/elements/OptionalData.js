import React, { Component } from "react"
import { connect } from "react-redux"

import { View, Text } from "react-native"

import Input from "../../../components/elements/Input"
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
                cardNumber: selectedCard.number
            }
        }

        if(selectedPaymentSystem.paymentSystem === 'QIWI'){

            const refPhoneNumber = this.refPhoneNumber.validate()

            if(!refPhoneNumber){
                throw new Error(strings('tradeScreen.modalError.additionalData'))
            } else {

                self.state.uniqueParams = {
                    phone: this.refPhoneNumber.getPhoneNumber()
                }
            }
        }
    }

    renderOptionalData = () => {

        const { selectedPaymentSystem, inputOnFocus } = this.props

        if(typeof selectedPaymentSystem.paymentSystem != 'undefined'){
            if(selectedPaymentSystem.paymentSystem === 'VISA_MC_P2P' && selectedPaymentSystem.currencyCode === 'RUB' && selectedPaymentSystem.provider === '365cash'){
                return <View />
            } else if(selectedPaymentSystem.paymentSystem === 'QIWI'){
                return (
                    <View>
                        <PhoneInput ref={ref => this.refPhoneNumber = ref} onFocus={inputOnFocus} />
                        {/*<Input*/}
                        {/*    ref={component => this.refPhoneNumber = component}*/}
                        {/*    id={'phoneNumber'}*/}
                        {/*    name={'Phone number'}*/}
                        {/*    type={'EMPTY'}*/}
                        {/*    onFocus={inputOnFocus}*/}
                        {/*    tapWrapperStyles={{ top: 6, right: 20, padding: 15, backgroundColor: '#fff' }}*/}
                        {/*    tapContentStyles={{ padding: 0, paddingHorizontal: 8, height: 30, borderRadius: 6, backgroundColor: '#F9F2FF' }}*/}
                        {/*    tapTextStyles={{ fontSize: 12 }}*/}
                        {/*    style={{ marginRight: 2, marginLeft: 30,  paddingRight: 30 }}*/}
                        {/*    keyboardType={'phone-pad'} />*/}
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