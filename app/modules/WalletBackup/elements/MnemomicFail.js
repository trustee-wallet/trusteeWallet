import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';

import Layout from '../../../components/elements/modal/Layout';
import Title from '../../../components/elements/modal/Title';
import Text from '../../../components/elements/modal/Text';
import Button from '../../../components/elements/modal/Button';
import Icon from '../../../components/elements/modal/Icon';
import ButtonWrap from '../../../components/elements/modal/ButtonWrap';

import { hideModal } from "../../../appstores/Actions/ModalActions";

import { strings } from '../../../../app/services/i18n';

export default class MnemomicFail extends Component {

    constructor(props){
        super(props);
    }

    hideModal = () => {
        this.props.callback();
        hideModal();
    };

    render() {
        return (
            <Layout visible={this.props.show}>
                <View>
                    <Icon callback={this.hideModal} icon='fail' />
                    <Title style={styles.title}>
                        { strings('walletBackup.mnemonicFail.title') }
                    </Title>
                   <Text style={styles.text}>
                        { strings('walletBackup.mnemonicFail.discription') }
                   </Text>
                    <ButtonWrap>
                        <Button onPress={this.hideModal}>
                            OK
                        </Button>
                    </ButtonWrap>
                </View>
            </Layout>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        marginTop: 15
    },
    text: {
        marginTop: 5
    }
});

/*
<Modal
                type='fail'
                title='Enter a password to encrypt your wallet'
                descr='You have done a mistake in recovery phrase. Please try again.'
                visible={this.state.visible}
                callback={this.callback}
            />
 */
