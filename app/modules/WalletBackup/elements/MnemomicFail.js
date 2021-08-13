/**
 * @version 0.10
 */
import React, { Component } from 'react'
import { View } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
import Icon from '../../../components/elements/modal/Icon'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../../app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'

class MnemomicFail extends Component {

    constructor(props) {
        super(props)
    }

    hideModal = () => {
        this.props.callback()
        hideModal()
    }

    render() {

        const { colors } = this.context

        return (
            <Layout visible={this.props.show}>
                <View>
                    <Icon callback={this.hideModal} icon='fail'/>
                    <Title style={{...styles.title, color: colors.common.text1 }}>
                        {strings('walletBackup.mnemonicFail.title')}
                    </Title>
                    <View style={{ marginTop: 8, marginBottom: -5 }}>
                        <Text style={{...styles.text, color: colors.sendScreen.amount }}>
                            {strings('walletBackup.mnemonicFail.description')}
                        </Text>
                    </View>
                    <View style={{ marginBottom: 30 }}>
                        <Button onPress={this.hideModal} color={colors.modal.warning} shadow={true} style={{ marginTop: 17 }}>
                            OK
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

MnemomicFail.contextType = ThemeContext

export default MnemomicFail

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
        letterSpacing: 0.5,
        marginBottom: -6
    }
}
