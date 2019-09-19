import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet } from 'react-native';

import Layout from '../../../components/elements/modal/Layout';
import Title from '../../../components/elements/modal/Title';
import Text from '../../../components/elements/modal/Text';
import Button from '../../../components/elements/modal/Button';
import Icon from '../../../components/elements/modal/Icon';
import ButtonWrap from '../../../components/elements/modal/ButtonWrap';

import { hideModal, showModal } from "../../../appstores/Actions/ModalActions";
import Line from "../../../components/elements/modal/Line";
import NavStore from "../../../components/navigation/NavStore";

import { strings } from '../../../services/i18n';

import App from '../../../appstores/Actions/App/App'
import { setLoaderStatus, proceedSaveGeneratedWallet } from '../../../appstores/Actions/MainStoreActions'
import Log from '../../../services/Log/Log'

class Skip extends Component {

    constructor(props){
        super(props);
    }

    handleSkip = async () => {
        hideModal();

        const { walletName, walletMnemonic } = this.props.createWallet;

        try {
            setLoaderStatus(true)

            await proceedSaveGeneratedWallet({
                walletName,
                walletMnemonic
            })

            setLoaderStatus(false)

            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.walletBackup.success'),
                description: strings('modal.walletBackup.walletCreated')
            }, () => {
                NavStore.reset('DashboardStack')
            });

            await App.refreshWalletsStore()

        } catch (e) {
            Log.err('WalletBackup.Skip errorSaving', e)
        }

    };

    handleHide = () => {
        hideModal();
    };

    render() {
        return (
            <Layout visible={this.props.show}>
                <View>
                    <Icon icon='warning' />
                    <Title style={styles.title}>
                        { strings('walletBackup.skipElement.title') }
                    </Title>
                    <Text style={styles.text}>
                        { strings('walletBackup.skipElement.description') }
                    </Text>
                    <ButtonWrap>
                        <Button onPress={this.handleHide}>
                            { strings('walletBackup.skipElement.cancel') }
                        </Button>
                        <Line />
                        <Button onPress={this.handleSkip}>
                            { strings('walletBackup.skipElement.yes') }
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
};

export default connect(mapStateToProps, {})(Skip);

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
