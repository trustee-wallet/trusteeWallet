/**
 * @version 0.10
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
import Icon from '../../../components/elements/modal/Icon'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

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

        const { title, icon, description, reverse } = this.props.data

        const { colors } = this.context

        return (
            <Layout visible={this.props.show}>
                <View>
                    <Icon callback={hideModal} icon={icon.toLowerCase()} />
                    <Title style={{...styles.title, color: colors.common.text1 }} textStyles={{ width: 'auto', paddingHorizontal: 10 }}>
                        {title}
                    </Title>
                    <View style={{ marginTop: 8, marginBottom: -5 }}>
                        <Text style={{...styles.text, color: colors.sendScreen.amount }}>
                            {description}
                        </Text>
                    </View>
                    <View>
                        <Button onPress={this.handleNo} color={'#F59E6C'} shadow={true} style={{ marginTop: 17 }}>
                            {reverse ? strings('walletBackup.skipElement.yes') : strings('walletBackup.skipElement.no')}
                        </Button>
                        <Button onPress={this.handleYes} style={{ backgroundColor: 'none', color: '#F59E6C' }}>
                            {reverse ? strings('walletBackup.skipElement.no') : strings('walletBackup.skipElement.yes')}
                        </Button>
                    </View>
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

YesNoModal.contextType = ThemeContext

export default connect(mapStateToProps, {})(YesNoModal)

const styles = {
    title: {
        fontFamily: 'Montserrat-Bold',
        fontStyle: 'normal',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'center',
        marginTop: -10,
        marginBottom: -2
    },
    text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        letterSpacing: 0.5
    }
}

/*
<Modal
                type='fail'
                title='Enter a password to encrypt your wallet'
                descr='You have done a mistake in recovery phrase. Please try again.'
                visible={this.state.visible}
                callback={this.callback}
            />
 */
