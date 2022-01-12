/**
 * @version 0.53
 * @author yura
 */
import React, { PureComponent } from 'react'
import { View, StyleSheet, Platform, StatusBar } from 'react-native'
import Video from 'react-native-video';

import NavStore from '@app/components/navigation/NavStore';

import { ThemeContext } from '@app/theme/ThemeProvider';

import Log from '@app/services/Log/Log';
import { strings } from '@app/services/i18n';
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'

import walletActions from '@app/appstores/Stores/Wallet/WalletActions';
import { showModal } from '@app/appstores/Stores/Modal/ModalActions';
import App from '@app/appstores/Actions/App/App'
import { setCallback, setFlowType, setMnemonicLength, setWalletMnemonic, setWalletName, proceedSaveGeneratedWallet } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'

import walletCreateVideo from '@assets/videos/KeyAndSeed.mp4'


const MNEMONIC_PHRASE_LENGTH = 128

class WalletCreateWithAnimation extends PureComponent {

    async componentDidMount() {
        this.createWallet()
    }

    componentWillUnmount() {
    }

    handleGreateWallet = (data) => {
        setFlowType(data)
        setCallback({ callback: 'InitScreen' })
        setMnemonicLength({ mnemonicLength: MNEMONIC_PHRASE_LENGTH })
    }

    createWallet = async () => {
        let walletMnemonic = ''
        let walletName = ''

        try {
            walletMnemonic = (await BlocksoftKeys.newMnemonic(MNEMONIC_PHRASE_LENGTH)).mnemonic

            walletName = await walletActions.getNewWalletName()

            setWalletMnemonic({ walletMnemonic })
            setWalletName({ walletName })

            try {
                await proceedSaveGeneratedWallet({
                    walletName,
                    walletMnemonic,
                    walletNumber: 1
                })
            } catch (e) {
                e.message += ' while proceedSaveGeneratedWallet'
                throw e
            }

            try {
                App.init({ source: 'WalletCreateWithAnimation.createWallet', onMount: false })
            } catch (e) {
                e.message += ' while WalletCreateWithAnimation.createWallet'
                throw e
            }

        } catch {
            Log.log('WalletCreateWithAnimation.createWallet error mnemonic generation')
        }

        if (!walletMnemonic || walletMnemonic === '') {
            Log.log('WalletCreateWithAnimation.createWallet no mnenonic for new wallet')
            showModal({
                type: 'INFO_MODAL',
                icon: 'WARNING',
                title: strings('settings.walletList.backupModal.title'),
                description: 'new wallet is not generated - please reinstall and restart'
            })
        }

        MarketingEvent.logEvent('gx_view_create_gif_screen_tap_create', { number: '1', source: 'WalletCreateWithAnimation' }, 'GX')
        this.handleGreateWallet({ flowType: 'CREATE_NEW_WALLET_GIF', source: 'WalletCreateWithAnimation', walletNumber: 1 })

    }

    handleGoHomeScreen = () => {
        setCallback({ callback: null })
        NavStore.reset('TabBar')
    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar barStyle='light-content' />
                <Video
                    source={walletCreateVideo}
                    ref={ref => this.player = ref}
                    style={styles.backgroundVideo}
                    fullscreen={Platform.OS === 'ios'}
                    resizeMode='contain'
                    repeat
                // onEnd={this.handleGoHomeScreen}
                />
            </View>
        )
    }
}

WalletCreateWithAnimation.contextType = ThemeContext

export default WalletCreateWithAnimation

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#262626'
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    },
})