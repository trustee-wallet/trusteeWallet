/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, StyleSheet } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
import Icon from '../../../components/elements/modal/Icon'
import ButtonWrap from '../../../components/elements/modal/ButtonWrap'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'
import Line from '../../../components/elements/modal/Line'

import { strings } from '../../../services/i18n'

class YesNoModal extends Component {

    constructor(props) {
        super(props)
    }

    handleYes = async () => {
        const { callback } = this.props

        callback()

        hideModal()
    }

    handleNo = () => {

        const { noCallback } = this.props.data

        hideModal()

        if (noCallback) {
            noCallback()
        }
    }

    render() {

        const { title, icon, description } = this.props.data

        return (
            <Layout visible={this.props.show}>
                <View>
                    <Icon callback={hideModal} icon={icon.toLowerCase()}/>
                    <Title style={styles.title} textStyles={{ width: 'auto', paddingHorizontal: 10 }}>
                        {title}
                    </Title>
                    <Text style={styles.text}>
                        {description}
                    </Text>
                    <ButtonWrap>
                        <Button onPress={this.handleNo}>
                            {strings('walletBackup.skipElement.no')}
                        </Button>
                        <Line/>
                        <Button onPress={this.handleYes}>
                            {strings('walletBackup.skipElement.yes')}
                        </Button>
                    </ButtonWrap>
                </View>
            </Layout>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        createWallet: state.createWalletStore,
        skipModal: state.createWalletStore.skipModal
    }
}

export default connect(mapStateToProps, {})(YesNoModal)

const styles = StyleSheet.create({
    title: {
        marginTop: 15
    },
    text: {
        marginTop: 5
    }
})

/*
<Modal
                type='fail'
                title='Enter a password to encrypt your wallet'
                descr='You have done a mistake in recovery phrase. Please try again.'
                visible={this.state.visible}
                callback={this.callback}
            />
 */
