/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { View, ScrollView, StyleSheet, Keyboard } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import Input from '@app/components/elements/NewInput'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'


class BackupSearchWalletScreen extends PureComponent {

    walletHashInput = React.createRef()


    handleGoToOne = async () => {
        try {
            Keyboard.dismiss()
            const inputValidate = await this.walletHashInput.handleValidate()
            if (inputValidate.status !== 'success' || inputValidate.value === '') {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: 'Wallet hash is required - please contact support to find your one'
                })
            } else {
                NavStore.goNext('BackupSearchOne', { walletHash: inputValidate.value })
            }
        } catch (e) {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }
    }

    handleSearchMnemonic = async () => {
        try {
            Keyboard.dismiss()
            const inputValidate = await this.walletHashInput.handleValidate()
            if (inputValidate.status !== 'success' || inputValidate.value === '') {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: 'Wallet hash is required - please contact support to find your one'
                })
            }
            setLoaderStatus(true)

            const result = await cryptoWalletsDS.getOneWalletText(inputValidate.value.trim())
            if (result) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.send.success'),
                    description: result
                })
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.exchange.sorry'),
                    description: 'Full mnemonic not found'
                })
            }
        } catch (e) {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }
        setLoaderStatus(false)
    }

    handleAllMnemonics = async () => {
        try {
            Keyboard.dismiss()

            setLoaderStatus(true)

            const result = await cryptoWalletsDS.getAllWalletsText()
            if (result) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.send.success'),
                    description: result
                })
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.send.success'),
                    description: 'No mnemonics'
                })
            }
        } catch (e) {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }
        setLoaderStatus(false)
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletManagment.BackupSearchWallet')
        const { GRID_SIZE } = this.context
        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={'Restore Wallet'}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ padding: GRID_SIZE, paddingTop: GRID_SIZE * 1.5 }}>
                        <View style={{ marginBottom: GRID_SIZE }}>

                                <View style={{ ...styles.inputWrapper, marginTop: GRID_SIZE, marginBottom: GRID_SIZE }}>
                                    <Input
                                        ref={ref => this.walletHashInput = ref}
                                        id={'walletHash'}
                                        name={'enter wallet hash'}
                                        inputBaseColor={'#f4f4f4'}
                                        inputTextColor={'#f4f4f4'}
                                        tintColor={'#7127ac'}
                                    />
                                </View>

                        </View>
                        <ListItem
                            title={'Search one Mnemonic'}
                            iconType="key"
                            onPress={() => this.handleSearchMnemonic()}
                            rightContent="arrow"
                        />
                        <ListItem
                            title={'Search all Mnemonics'}
                            iconType="key"
                            onPress={() => this.handleAllMnemonics()}
                            rightContent="arrow"
                            last
                        />
                        <ListItem
                            title={'Search all keys'}
                            iconType="key"
                            onPress={() => this.handleGoToOne()}
                            rightContent="arrow"
                            last
                        />
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

BackupSearchWalletScreen.contextType = ThemeContext

export default BackupSearchWalletScreen

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    }
})
