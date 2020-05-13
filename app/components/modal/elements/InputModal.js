/**
 * @version 0.9
 * @misha - is it actually used? seems not translated
 */
import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
import ButtonWrap from '../../../components/elements/modal/ButtonWrap'
import Input from '../../../components/elements/Input'
import Line from '../../elements/modal/Line'

import { hideModal, showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../../services/i18n'
import { setQRConfig, setQRValue } from '../../../appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import NavStore from '../../navigation/NavStore'
import AddressInput from '../../elements/Input'

export default class InputModal extends Component {

    constructor(props) {
        super(props)
    }

    handleHide = () => {
        hideModal()
    }

    handleSubmit = async () => {
        const { cashBackLink } = this.props.data

        const { callback } = this.props

        const res = await this.cashBackInput.handleValidate()

        if (cashBackLink === res.value) {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.cashBackLinkEqualModal.description')
            })
            return
        }

        if (res.status === 'success') {
            let cashBackParentToken = res.value.split('/')
            cashBackParentToken = cashBackParentToken[cashBackParentToken.length - 1]
            if (callback) {
                callback(cashBackParentToken)
            }
        }
    }


    componentDidMount() {
        const { qrCashBackLink } = this.props.data
        if (qrCashBackLink && this.cashBackInput) {
            this.cashBackInput.handleInput(qrCashBackLink)
        }
    }

    render() {
        const { show } = this.props
        const { title, description } = this.props.data

        return (
            <Layout visible={show}>
                <View>
                    <Title style={styles.title}>
                        {title}
                    </Title>
                    <Text style={styles.text}>
                        {description}
                    </Text>
                    <View style={{ height: 60, paddingHorizontal: 20 }}>
                        <Input
                            ref={ref => this.cashBackInput = ref}
                            id={'cashBackInput'}
                            name={strings('cashback.inputParentCashBackLink')}
                            paste={true}
                            qr={true}
                            qrCallback={() => {
                                setQRConfig({
                                    type: 'CASH_BACK_LINK'
                                })
                                this.handleHide()
                                NavStore.goNext('QRCodeScannerScreen')
                            }}
                            isCapitalize={false}
                            type={'CASH_BACK_LINK'}/>
                    </View>
                    <ButtonWrap>
                        <Button onPress={() => this.handleHide()}>
                            {strings('walletBackup.skipElement.cancel')}
                        </Button>
                        <Line/>
                        <Button onPress={() => this.handleSubmit()}>
                            {strings('walletCreate.submit')}
                        </Button>
                    </ButtonWrap>
                </View>
            </Layout>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        marginTop: 35
    },
    text: {
        marginTop: 5
    }
})
