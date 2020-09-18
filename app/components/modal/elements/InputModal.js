/**
 * @version 0.10
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
import Log from '../../../services/Log/Log'

export default class InputModal extends Component {

    constructor(props) {
        super(props)
    }

    handleHide = () => {
        hideModal()
    }

    handleSubmit = async () => {
        const { cashbackLink } = this.props.data

        const { callback } = this.props

        const res = await this.cashbackInput.handleValidate()

        if (cashbackLink === res.value) {
            Log.log('CashbackLink inputParent for ' + cashbackLink + ' is equal ' + res.value)
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.cashbackLinkEqualModal.description', {link : res.value})
            })
            return
        }

        Log.log('CashbackLink inputParent for  ' + cashbackLink + ' res ', res)

        if (res.status === 'success') {
            let cashbackParentToken = res.value.split('/')
            cashbackParentToken = cashbackParentToken[cashbackParentToken.length - 1]
            if (callback) {
                callback(cashbackParentToken)
            }
        }
    }


    componentDidMount() {
        const { qrCashbackLink } = this.props.data
        if (qrCashbackLink && this.cashbackInput) {
            this.cashbackInput.handleInput(qrCashbackLink)
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
                            ref={ref => this.cashbackInput = ref}
                            id={'cashbackInput'}
                            name={strings('cashback.inputParentCashbackLink')}
                            paste={true}
                            qr={true}
                            qrCallback={() => {
                                setQRConfig({
                                    type: 'CASHBACK_LINK'
                                })
                                this.handleHide()
                                NavStore.goNext('QRCodeScannerScreen')
                            }}
                            isCapitalize={false}
                            type={'CASHBACK_LINK'}/>
                    </View>
                    <View>
                        <Button onPress={() => this.handleHide()} color={'#864DD9'} shadow={true} style={{ marginTop: 17 }}>
                            {strings('walletBackup.skipElement.cancel')}
                        </Button>
                        <Button onPress={() => this.handleSubmit()} style={{ backgroundColor: 'none', color: '#864DD9' }}>
                            {strings('walletCreate.submit')}
                        </Button>
                    </View>
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
