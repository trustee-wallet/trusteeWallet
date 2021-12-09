/**
 * @version 0.30
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity } from 'react-native'

import LetterSpacing from '../../../../components/elements/LetterSpacing'

import { strings } from '../../../../services/i18n'

import { showModal } from '../../../../appstores/Stores/Modal/ModalActions'

import walletActions from '../../../../appstores/Stores/Wallet/WalletActions'
import walletHDActions from '../../../../appstores/Actions/WalletHDActions'
import WalletPub from '../../../../appstores/DataSource/Wallet/WalletPub'

import { setLoaderStatus, setSelectedAccount } from '../../../../appstores/Stores/Main/MainStoreActions'
import Log from '../../../../services/Log/Log'
import settingsActions from '../../../../appstores/Stores/Settings/SettingsActions'
import UIDict from '../../../../services/UIDict/UIDict'

import copyToClipboard from '../../../../services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '../../../../services/UI/Toast/Toast'
import BlocksoftPrettyStrings from '../../../../../crypto/common/BlocksoftPrettyStrings'

import { ThemeContext } from '@app/theme/ThemeProvider'
import styles from './styles'

import ListItem from '../../../../components/elements/new/list/ListItem/Setting'
import SubSetting from '../../../../components/elements/new/list/ListItem/SubSetting'
import Copy from 'react-native-vector-icons/MaterialCommunityIcons'


class SettingsBTC extends Component {

    constructor(props) {
        super(props)
        this.state = {
            xpubs: false,
            xpubsGenerating: false,
            dropMenu: false
        }
    }

    handleEnableHD = () => {

        const { walletIsHd, walletHash } = this.props.wallet
        if (walletIsHd) {
            return false
        }

        showModal({
            type: 'YES_NO_MODAL',
            title: strings('settings.walletList.hdEnableModal.title'),
            icon: 'WARNING',
            description: strings('settings.walletList.hdEnableModal.description')
        }, async () => {
            setLoaderStatus(true)

            await walletHDActions.turnOnHD(walletHash)

            setLoaderStatus(false)
        })
    }

    handleUseUnconfirmed = () => {
        const { walletHash, walletUseUnconfirmed } = this.props.wallet
        walletActions.setUse({ walletHash, walletUseUnconfirmed: walletUseUnconfirmed > 0 ? 0 : 1 })
    }

    handleAllowReplaceByFee = () => {
        const { walletHash, walletAllowReplaceByFee } = this.props.wallet
        walletActions.setUse({ walletHash, walletAllowReplaceByFee: walletAllowReplaceByFee > 0 ? 0 : 1 })
    }

    toggleAddress = async (newValue, oldValue) => {
        try {
            setLoaderStatus(true)
            if (newValue === 'two_addresses') {
                // @todo as btcShowTwoAddress this will be deprecated remove from code
                await settingsActions.setSettings('btcShowTwoAddress', '1')
            } else {
                await settingsActions.setSettings('btcShowTwoAddress', '0')
                await settingsActions.setSettings('btc_legacy_or_segwit', newValue)
                await setSelectedAccount('SettingsBTC.toggleAddress')
            }
            setLoaderStatus(false)
        } catch (e) {
            Log.log('Settigs.BTC.toggleSegWit ' + e.message, { oldValue, newValue })
        }
        setLoaderStatus(false)
    }

    toggleDropMenu = () => {
        this.setState({
            dropMenu: !this.state.dropMenu
        })
    }


    _loadXpubs = async () => {
        const { wallet } = this.props
        if (this.state.xpubsGenerating) return
        this.state.xpubsGenerating = true
        const xpubs = await WalletPub.getOrGenerate({
            currencyCode: 'BTC',
            walletHash: wallet.walletHash,
            needLegacy: true,
            needSegwit: true,
            needSegwitCompatible: true
        })
        this.setState({ xpubs, xpubsGenerating: false })
    }

    handleCopy = (copy) => {

        copyToClipboard(copy)

        Toast.setMessage(strings('toast.copied')).show()
    }

    showLegacySegwitHandle = (btcLegacyOrSegWit, color) => {
        return (
            <View style={{ paddingHorizontal: 30 }}>
                <SubSetting
                    checked={btcLegacyOrSegWit === 'segwit'}
                    title={strings('settings.walletList.showSegWit')}
                    onPress={() => this.toggleAddress('segwit', btcLegacyOrSegWit)}
                    radioButtonFirst={true}
                    withoutLine={true}
                    checkedStyle={true}
                />
                <SubSetting
                    checked={btcLegacyOrSegWit === 'legacy'}
                    title={strings('settings.walletList.showLegacy')}
                    onPress={() => this.toggleAddress('legacy', btcLegacyOrSegWit)}
                    radioButtonFirst={true}
                    withoutLine={true}
                    checkedStyle={true}
                />
            </View>
            // <View style={[styles.settings__row, { paddingHorizontal: 30 }]}>
            //     <Text style={[styles.settings__title, {
            //         marginTop: 10,
            //         marginBottom: 5,
            //         fontSize: 14,
            //         fontFamily: 'Montserrat-Bold'
            //     }]}>
            //         {strings('settings.walletList.accountSetting')}
            //     </Text>
            //     <TouchableOpacity
            //         style={styles.mnemonicLength__item}
            //         disabled={btcLegacyOrSegWit === 'segwit'}
            //         onPress={() => this.toggleAddress('segwit', btcLegacyOrSegWit)}>
            //         <View style={styles.radio}>
            //             <View style={btcLegacyOrSegWit === 'segwit' ? {
            //                 ...styles.radio__dot,
            //                 backgroundColor: color
            //             } : null} />
            //         </View>
            //         <LetterSpacing text={strings('settings.walletList.showSegWit')}
            //             textStyle={{ ...styles.settings__title }} letterSpacing={0.5} />
            //     </TouchableOpacity>
            //     <TouchableOpacity
            //         style={styles.mnemonicLength__item}
            //         disabled={btcLegacyOrSegWit === 'legacy'}
            //         onPress={() => this.toggleAddress('legacy', btcLegacyOrSegWit)}>
            //         <View style={styles.radio}>
            //             <View style={btcLegacyOrSegWit === 'legacy' ? {
            //                 ...styles.radio__dot,
            //                 backgroundColor: color
            //             } : null} />
            //         </View>
            //         <LetterSpacing text={strings('settings.walletList.showLegacy')}
            //             textStyle={{ ...styles.settings__title }} letterSpacing={0.5} />
            //     </TouchableOpacity>
            //     <TouchableOpacity
            //         style={styles.mnemonicLength__item}
            //         disabled={btcLegacyOrSegWit === 'two_addresses'}
            //         onPress={() => this.toggleAddress('two_addresses', btcLegacyOrSegWit)}>
            //         <View style={styles.radio}>
            //             <View style={btcLegacyOrSegWit === 'two_addresses' ? {
            //                 ...styles.radio__dot,
            //                 backgroundColor: color
            //             } : null} />
            //         </View>
            //         <LetterSpacing text={strings('settings.walletList.showSegWitAndLegacy')}
            //             textStyle={{ ...styles.settings__title }} letterSpacing={0.5} />
            //     </TouchableOpacity>
            // </View>
        )
    }


    render() {

        const { colors, GRID_SIZE } = this.context

        const { wallet, containerStyle, settingsStore, mainStore } = this.props

        const { btcShowTwoAddress = 0 } = settingsStore
        const dict = new UIDict(mainStore.selectedCryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        let btcLegacyOrSegWit = settingsStore.btc_legacy_or_segwit
        if (!!JSON.parse(btcShowTwoAddress)) {
            btcLegacyOrSegWit = 'two_addresses'
        }

        if (wallet.walletIsHd && !this.state.xpubs) {
            this._loadXpubs()
        }
        let xpubsHtml = null
        if (this.state.xpubs) {
            let val1 = ''
            if (typeof this.state.xpubs['btc.44'] !== 'undefined') {
                val1 = this.state.xpubs['btc.44'].walletPubValue
            }
            let val1S = ''
            let val2 = ''
            if (typeof this.state.xpubs['btc.49'] !== 'undefined') {
                val2 = this.state.xpubs['btc.49'].walletPubValue
            }
            let val2S = ''
            let val3 = ''
            if (typeof this.state.xpubs['btc.84'] !== 'undefined') {
                val3 = this.state.xpubs['btc.84'].walletPubValue
            }
            let val3S = ''
            if (val1) {
                val1S = BlocksoftPrettyStrings.makeCut(val1, 10)
            }
            if (val2) {
                val2S = BlocksoftPrettyStrings.makeCut(val2, 10)
            }
            if (val3) {
                val3S = BlocksoftPrettyStrings.makeCut(val3, 10)
            }
            xpubsHtml =
                <View style={{ paddingBottom: 10, paddingLeft: 26 }}>
                    <View style={{...styles.settings__row, paddingTop: 0 }}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15, flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => this.handleCopy(val1)}>
                                    <Text style={{...styles.publicKey, color: colors.common.text1 }}>{val1S}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.handleCopy(val1)}
                                    style={styles.copyBtn}>
                                    <Copy name="content-copy" size={15} color={'#939393'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15, flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => this.handleCopy(val2)}>
                                    <Text style={{...styles.publicKey, color: colors.common.text1 }}>{val2S}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.handleCopy(val2)}
                                    style={styles.copyBtn}>
                                    <Copy name="content-copy" size={15} color={'#939393'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15, flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => this.handleCopy(val3)}>
                                    <Text style={{...styles.publicKey, color: colors.common.text1 }}>{val3S}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.handleCopy(val3)}
                                    style={styles.copyBtn}>
                                    <Copy name="content-copy" size={15} color={'#939393'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
        }

        return (
            <>
                <View >
                    <ListItem
                        title={strings('settings.walletList.useUnconfirmed')}
                        iconType="unconfirmed"
                        onPress={this.handleUseUnconfirmed}
                        rightContent="switch"
                        switchParams={{ value: !!wallet.walletUseUnconfirmed, onPress: this.handleUseUnconfirmed }}
                    />
                    <ListItem
                        title={strings('settings.walletList.allowReplaceByFee')}
                        iconType="rbf"
                        onPress={this.handleAllowReplaceByFee}
                        rightContent="switch"
                        switchParams={{ value: !!wallet.walletAllowReplaceByFee, onPress: this.handleAllowReplaceByFee }}
                    />
                    <ListItem
                        title={strings('settings.walletList.hd')}
                        subtitle={strings('settings.walletList.hdDescription')}
                        iconType="hd"
                        onPress={this.handleEnableHD}
                        rightContent="switch"
                        switchParams={{ value: !!wallet.walletIsHd, onPress: this.handleEnableHD }}
                        disabledRightContent={wallet.walletIsHd ? true : false}
                        ExtraView={() => {
                            return (xpubsHtml)
                        }
                        }
                    />

                    <ListItem
                        title={strings('settings.walletList.accountAddress')}
                        iconType="address"
                        onPress={this.toggleDropMenu}
                        rightContent={this.state.dropMenu ? 'arrow_up' : "arrow_down"}
                        switchParams={{ value: !!this.state.dropMenu, onPress: this.toggleDropMenu }}
                        type={'dropdown'}
                        ExtraView={() => this.showLegacySegwitHandle(btcLegacyOrSegWit, color)}
                        subtitle={btcLegacyOrSegWit === 'segwit' ? strings('settings.walletList.showSegWit') : strings('settings.walletList.showLegacy')}
                    />
                </View>
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore.data,
        mainStore: state.mainStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

SettingsBTC.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsBTC)
