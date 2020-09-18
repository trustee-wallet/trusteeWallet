/**
 * @version 0.9
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

export default class MnemomicFail extends Component {

    constructor(props) {
        super(props)
    }

    hideModal = () => {
        this.props.callback()
        hideModal()
    }

    render() {
        return (
            <Layout visible={this.props.show}>
                <View>
                    <Icon callback={this.hideModal} icon='fail'/>
                    <Title style={styles.title}>
                        {strings('walletBackup.mnemonicFail.title')}
                    </Title>
                    <View style={{ marginTop: 16, marginBottom: 30 }}>
                        <Text style={styles.text}>
                            {strings('walletBackup.mnemonicFail.description')}
                        </Text>
                    </View>
                    <View style={{marginBottom: 30 }}>
                        <Button onPress={this.hideModal} color={'#E54C4C'} shadow={true}>
                            OK
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

const styles = {
    title: {
        fontFamily: 'Montserrat-Bold',
        fontStyle: 'normal',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'center',
        color: '#404040'
    },
    text: {
        color: '#5C5C5C',
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
