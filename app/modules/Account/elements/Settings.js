/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Platform, Switch, Text, TouchableOpacity } from 'react-native'

import LetterSpacing from '../../../components/elements/LetterSpacing'

import { strings } from '../../../services/i18n'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import walletActions from '../../../appstores/Stores/Wallet/WalletActions'
import walletHDActions from '../../../appstores/Actions/WalletHDActions'
import WalletPub from '../../../appstores/DataSource/Wallet/WalletPub'

import { setLoaderStatus, setSelectedAccount } from '../../../appstores/Stores/Main/MainStoreActions'
import Log from '../../../services/Log/Log'
import settingsActions from '../../../appstores/Stores/Settings/SettingsActions'
import UIDict from '../../../services/UIDict/UIDict'

import copyToClipboard from '../../../services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '../../../services/UI/Toast/Toast'

class Wallet extends Component {

    constructor(props) {
        super(props)
        this.state = {
            xpubs: false,
            xpubsGenerating: false
        }
    }

    handleEnableHD = () => {

        const { walletHash } = this.props.wallet

        showModal({
            type: 'YES_NO_MODAL',
            title: strings('settings.walletList.hdEnableModal.title'),
            icon: 'WARNING',
            description: strings('settings.walletList.hdEnableModal.description')
        }, () => {
            walletHDActions.turnOnHD(walletHash)
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

    handleUseLegacy = () => {
        const { walletHash, walletUseLegacy } = this.props.wallet
        walletActions.setUse({ walletHash, walletUseLegacy: walletUseLegacy > 0 ? 0 : 1 })
    }

    toggleAddress = async () => {
        try {
            setLoaderStatus(true)
            const setting = await walletActions.setSelectedSegwitOrNot()
            await setSelectedAccount(setting)
            await settingsActions.setSettings('btcShowTwoAddress', '0')
            setLoaderStatus(false)
        } catch (e) {
            Log.log('Settigs.BTC.toggleSegWit' + e.message)
        }
        setLoaderStatus(false)
    }

    toggleSegWitLegacy = async () => {
        await settingsActions.setSettings('btcShowTwoAddress', '1')
    }

    _loadXpubs = async () => {
        const { wallet } = this.props
        if (this.state.xpubsGenerating) return
        this.state.xpubsGenerating = true
        const xpubs = await WalletPub.getOrGenerate({ currencyCode: 'BTC', walletHash: wallet.walletHash, needLegacy: true, needSegwit: true, needSegwitCompatible: true })
        this.setState({ xpubs, xpubsGenerating: false })
    }

    handleCopy = (copy) => {

        copyToClipboard(copy)

        Toast.setMessage(strings('toast.copied')).show()
    }


    render() {

        const { wallet, containerStyle, settingsStore, mainStore } = this.props

        const { btc_legacy_or_segwit: btcLegacyOrSegWit, btcShowTwoAddress = 0 } = settingsStore
        const dict = new UIDict(mainStore.selectedCryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

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
                val1S = val1.slice(0, 14) + '...' + val1.slice(-14)
            }
            if (val2) {
                val2S = val2.slice(0, 14) + '...' + val2.slice(-14)
            }
            if (val3) {
                val3S = val3.slice(0, 14) + '...' + val3.slice(-14)
            }
            xpubsHtml =
                <View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15 }}>
                                <TouchableOpacity onPress={() => this.handleCopy(val1)}>
                                    <Text>{val1S}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15 }}>
                                <TouchableOpacity onPress={() => this.handleCopy(val2)}>
                                    <Text>{val2S}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15 }}>
                                <TouchableOpacity onPress={() => this.handleCopy(val3)}>
                                    <Text>{val3S}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
        }

        return (
            <View style={[styles.settings, containerStyle]}>
                <View style={styles.settings__row}>
                    <Text style={styles.settings__main__title}>{strings('account.assetSettings')}</Text>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15 }}>
                            <LetterSpacing text={strings('settings.walletList.useUnconfirmed')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5} numberOfLines={2}/>
                        </View>
                        <View>
                            {
                                Platform.OS === 'android' ?
                                    <Switch
                                        thumbColor="#fff"
                                        trackColor={{ true: '#864DD9', false: '#dadada' }}
                                        onValueChange={this.handleUseUnconfirmed}
                                        value={!!wallet.walletUseUnconfirmed}
                                        disabled={false}/>
                                    :
                                    <Switch
                                        trackColor={{ true: '#864DD9' }}
                                        style={{ marginTop: -3, transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
                                        onValueChange={this.handleUseUnconfirmed}
                                        value={!!wallet.walletUseUnconfirmed}
                                        disabled={false}/>
                            }
                        </View>
                    </View>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15 }}>
                            <LetterSpacing text={strings('settings.walletList.allowReplaceByFee')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5} numberOfLines={2}/>
                        </View>
                        <View>
                            {
                                Platform.OS === 'android' ?
                                    <Switch
                                        thumbColor="#fff"
                                        trackColor={{ true: '#864DD9', false: '#dadada' }}
                                        onValueChange={this.handleAllowReplaceByFee}
                                        value={!!wallet.walletAllowReplaceByFee}
                                        disabled={false}/>
                                    :
                                    <Switch
                                        trackColor={{ true: '#864DD9' }}
                                        style={{ marginTop: -3, transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
                                        onValueChange={this.handleAllowReplaceByFee}
                                        value={!!wallet.walletAllowReplaceByFee}
                                        disabled={false}/>
                            }
                        </View>
                    </View>
                </View>
                <View style={[styles.settings__row]}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15 }}>
                            <LetterSpacing text={'HD'} textStyle={{ ...styles.settings__title }} letterSpacing={0.5}/>
                        </View>
                        <View>
                            {
                                Platform.OS === 'android' ?
                                    <Switch
                                        thumbColor="#fff"
                                        trackColor={{ true: '#864DD9', false: '#dadada' }}
                                        onValueChange={this.handleEnableHD}
                                        value={!!wallet.walletIsHd}
                                        disabled={!!wallet.walletIsHd}/>
                                    :
                                    <Switch
                                        trackColor={{ true: '#864DD9' }}
                                        style={{ marginTop: -3, transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
                                        onValueChange={this.handleEnableHD}
                                        value={!!wallet.walletIsHd}
                                        disabled={!!wallet.walletIsHd}/>
                            }
                        </View>
                    </View>
                </View>
                {xpubsHtml}
                <View style={[styles.settings__row, { paddingHorizontal: 30 }]}>
                    <Text style={[styles.settings__title, { marginTop: 10, marginBottom: 5, fontSize: 14, fontFamily: 'Montserrat-Bold' }]}>
                        {strings('settings.walletList.changeSetting')}
                    </Text>
                    <TouchableOpacity
                        style={styles.mnemonicLength__item}
                        onPress={this.handleUseLegacy}>
                        <View style={styles.radio}>
                            <View style={!wallet.walletUseLegacy ? { ...styles.radio__dot, backgroundColor: color } : null}/>
                        </View>
                        <LetterSpacing text={strings('settings.walletList.useSegWit')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5}/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.mnemonicLength__item}
                        onPress={this.handleUseLegacy}>
                        <View style={styles.radio}>
                            <View style={!!wallet.walletUseLegacy ? { ...styles.radio__dot, backgroundColor: color } : null}/>
                        </View>
                        <LetterSpacing text={strings('settings.walletList.useLegacy')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5}/>
                    </TouchableOpacity>
                </View>
                <View style={[styles.settings__row, { paddingHorizontal: 30 }]}>
                    <Text style={[styles.settings__title, { marginTop: 10, marginBottom: 5, fontSize: 14, fontFamily: 'Montserrat-Bold' }]}>
                        {strings('settings.walletList.accountSetting')}
                    </Text>
                    <TouchableOpacity
                        style={styles.mnemonicLength__item}
                        disabled={btcLegacyOrSegWit === 'segwit' && !JSON.parse(btcShowTwoAddress)}
                        onPress={() => this.toggleAddress()}>
                        <View style={styles.radio}>
                            <View style={btcLegacyOrSegWit === 'segwit' && !JSON.parse(btcShowTwoAddress) ? { ...styles.radio__dot, backgroundColor: color } : null}/>
                        </View>
                        <LetterSpacing text={strings('settings.walletList.showSegWit')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5}/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.mnemonicLength__item}
                        disabled={btcLegacyOrSegWit === 'legacy' && !JSON.parse(btcShowTwoAddress)}
                        onPress={() => this.toggleAddress()}>
                        <View style={styles.radio}>
                            <View style={btcLegacyOrSegWit === 'legacy' && !JSON.parse(btcShowTwoAddress) ? { ...styles.radio__dot, backgroundColor: color } : null}/>
                        </View>
                        <LetterSpacing text={strings('settings.walletList.showLegacy')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5}/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.mnemonicLength__item}
                        disabled={!!JSON.parse(btcShowTwoAddress)}
                        onPress={() => this.toggleSegWitLegacy()}>
                        <View style={styles.radio}>
                            <View style={!!JSON.parse(btcShowTwoAddress) ? { ...styles.radio__dot, backgroundColor: color } : null}/>
                        </View>
                        <LetterSpacing text={strings('settings.walletList.showSegWitAndLegacy')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5}/>
                    </TouchableOpacity>
                </View>

            </View>
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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Wallet)

const styles = {
    settings: {
        position: 'relative',
        justifyContent: 'space-between',
        alignContent: 'flex-end',

        marginBottom: 100,

        borderRadius: 16,

        zIndex: 2
    },
    settings__main__title: {
        marginLeft: 15,
        marginBottom: 10,
        marginTop: -8,
        color: '#404040',
        fontSize: 16,
        fontFamily: 'Montserrat-Bold'
    },
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        color: '#404040'
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
    settings__close: {
        position: 'absolute',
        top: 24,
        right: 0,

        padding: 15
    },
    settings__close__icon: {
        fontSize: 24,
        color: '#864DD9'
    },
    settings__line: {
        height: 1
    },
    settings__line__item: {
        height: '100%',
        backgroundColor: '#000'
    },
    mnemonicLength__item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',

        paddingVertical: 10,
        marginRight: 20
    },
    radio: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#404040',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    }
}
