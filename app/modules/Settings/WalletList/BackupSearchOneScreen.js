/**
 * @version 0.43
 */
import React from 'react'

import { Keyboard, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import Input from '@app/components/elements/NewInput'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'
import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import Database from '@app/appstores/DataSource/Database';
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'



class BackupSearchOneScreen extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            show: false,
            addresses : []
        }
    }

    async componentDidMount() {
        const data = NavStore.getParamWrapper(this, 'walletHash')
        if (data && data !== '') {
            this._handleFind(data)
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: 'Wallet hash is required - please contact support to find your one'
            })
        }
    }


    _handleFind = async (hash) => {
        try {

            Keyboard.dismiss()

            setLoaderStatus(true)

            const walletHash = await settingsActions.getSelectedWallet('BackupSearchOneScreen')

            const sql = `SELECT account.wallet_hash AS walletHash, account.currency_code AS currencyCode, account.address, account.derivation_path as derivationPath
            FROM account
            WHERE wallet_hash='${walletHash}'
            ORDER BY account.id
        `
            const res = await Database.query(sql)

            const unique = {}
            const addresses = []
            const derivations = [
                {path : 'm/44quote/0quote/0quote/0/0', code : 'BTC'},
                {path : 'm/84quote/0quote/0quote/0/0', code : 'BTC'},
                {path : 'm/44quote/60quote/0quote/0/0', code : 'ETH'},
                {path : 'm/44quote/2quote/0quote/0/0', code : 'LTC'},
                {path : 'm/84quote/2quote/0quote/0/0', code : 'LTC'},
            ]

            for (const derivation of derivations) {
                const key = await cryptoWalletsDS.getOneWalletText(hash, derivation.path, derivation.code)
                if (typeof key !== 'undefined' && key && typeof unique[key.address] === 'undefined') {
                    unique[derivation.code] = key
                    key.currencyCode = derivation.code
                    addresses.push(key)
                    unique[key.address] = 1
                }
            }

            for (const row of res.array) {
                if (typeof unique[row.currencyCode] !== 'undefined') {
                    continue
                }
                if (!hash || hash === '') {
                    hash = row.walletHash
                }
                const key = await cryptoWalletsDS.getOneWalletText(hash, row.derivationPath, row.currencyCode)
                unique[row.currencyCode] = key
                if (typeof key !== 'undefined' && key && typeof unique[key.address] === 'undefined') {
                    key.currencyCode = row.currencyCode
                    addresses.push(key)
                }
                unique[key.address] = 1
            }

            setLoaderStatus(false)

            if (addresses.length > 0) {
                this.setState({
                    addresses,
                    show: true
                })
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.send.fail'),
                    description: 'NO KEYS FOUND'
                })
            }


        } catch (e) {
            Log.err('WalletCreate.EnterHashToFind error ' + e.message)

            setLoaderStatus(false)

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.send.fail'),
                description: e.message
            })

        }
    }

    handleCopy = (address) => {
        copyToClipboard(address)
        Toast.setMessage(strings('toast.copied')).show()
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        const { show, addresses } = this.state

        MarketingAnalytics.setCurrentScreen('WalletManagment.BackupSearchOne')
        const { GRID_SIZE } = this.context
        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={'Restore Keys'}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ padding: GRID_SIZE, paddingTop: GRID_SIZE * 1.5 }}>
                        {
                            show ?
                                addresses.map((item, index) => {

                                    const address = item.address
                                    const addressPrep = BlocksoftPrettyStrings.makeCut(address, 10, 8)
                                    const addressPriv = BlocksoftPrettyStrings.makeCut(item.privateKey, 10, 8)
                                    return <View style={styles.settings__row} key={index}>
                                        <View style={styles.settings__content}>
                                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                                                <LetterSpacing text={item.currencyCode}
                                                               textStyle={{ ...styles.settings__title }}
                                                               letterSpacing={0.5}
                                                               numberOfLines={2} />
                                            </View>
                                            <View style={{ flex: 2, paddingLeft: 5, paddingRight: 5 }}>
                                                <TouchableOpacity onPress={() => this.handleCopy(item.address)}>
                                                    <LetterSpacing text={addressPrep}
                                                                   textStyle={{ ...styles.settings__title }}
                                                                   letterSpacing={0.5}
                                                                   numberOfLines={2} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ flex: 2, paddingLeft: 5, paddingRight: 15 }}>
                                                <TouchableOpacity onPress={() => this.handleCopy(item.privateKey)}>
                                                    <LetterSpacing text={addressPriv}
                                                                   textStyle={{ ...styles.settings__title }}
                                                                   letterSpacing={0.5}
                                                                   numberOfLines={2} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                                })
                                : null
                        }
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

BackupSearchOneScreen.contextType = ThemeContext

export default BackupSearchOneScreen


const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
    },
    settings__row: {

        paddingHorizontal: 16,
        paddingTop: 8
    },
    settings__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
})
