/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform
} from 'react-native'

import firebase from 'react-native-firebase'
import Share from 'react-native-share'

import Fontisto from 'react-native-vector-icons/Fontisto'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import GradientView from '../../components/elements/GradientView'
import LetterSpacing from '../../components/elements/LetterSpacing'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import LightButton from '../../components/elements/LightButton'
import CustomIcon from '../../components/elements/CustomIcon'
import Loader from '../../components/elements/LoaderItem'

import { strings, sublocale } from '../../services/i18n'

import Toast from '../../services/UI/Toast/Toast'
import Netinfo from '../../services/Netinfo/Netinfo'
import Log from '../../services/Log/Log'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

import FileSystem from '../../services/FileSystem/FileSystem'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '../../appstores/Stores/Main/MainStoreActions'
import walletHDActions from '../../appstores/Actions/WalletHDActions'
import walletActions from '../../appstores/Stores/Wallet/WalletActions'

import ExchangeActions from '../../appstores/Stores/Exchange/ExchangeActions'

import Theme from '../../themes/Themes'

import qrLogo from '../../assets/images/logoWithWhiteBG.png'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'

import UIDict from '../../services/UIDict/UIDict'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import QrCodeBox from '../../components/elements/QrCodeBox'
import OldPhone from '../../services/UI/OldPhone/OldPhone'
import prettyShare from '../../services/UI/PrettyShare/PrettyShare'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

let styles


class ReceiveScreen extends Component {

    constructor() {
        super()
        this.state = {
            settingAddressType: ''
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        styles = Theme.getStyles().receiveScreenStyles

        settingsActions.getSetting('btc_legacy_or_segwit').then(res => this.setState({ settingAddressType: res }))
    }

    copyToClip = () => {
        const { settingAddressType } = this.state

        try {
            let { address, legacyAddress, segwitAddress } = this.props.account
            if (settingAddressType === 'legacy' && legacyAddress) {
                address = legacyAddress
            } else if (segwitAddress) {
                address = segwitAddress
            }

            copyToClipboard(address)

            Toast.setMessage(strings('toast.copied')).show()
        } catch (e) {
            Log.err('ReceiveScreen.copyToClip error', e.message)
        }

    }

    getAddress = () => {
        const { settingAddressType } = this.state
        let { address, legacyAddress, segwitAddress } = this.props.account
        if (settingAddressType === 'legacy' && legacyAddress) {
            address = legacyAddress
        } else if (segwitAddress) {
            address = segwitAddress
        }
        Log.log('ReceiveScreen.getAddress ' + address, {address, legacyAddress, segwitAddress, settingAddressType})
        return address
    }

    getAddressForQR = () => {
        const { currencySymbol } = this.props.cryptoCurrency
        const { currencyCode } = this.props.account

        try {

            const address = this.getAddress()

            const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            let linkForQR = ''

            if (typeof extend.addressCurrencyCode !== 'undefined') {
                let currencyName = BlocksoftDict.Currencies[extend.addressCurrencyCode].currencyName
                currencyName = currencyName.toLowerCase().replace(' ', '')

                if (typeof extend.tokenAddress !== 'undefined') {
                    linkForQR = `${currencyName}:${address}?contractAddress=${extend.tokenAddress}&symbol=${currencySymbol}`
                } else if (typeof extend.tokenName !== 'undefined') {
                    linkForQR = `${currencyName}:${address}?contractAddress=${extend.tokenName}&symbol=${currencySymbol}`
                } else {
                    linkForQR = `${currencyName}:${address}?symbol=${currencySymbol}`
                }
            } else {
                linkForQR = `${extend.currencyName.toLowerCase().replace(' ', '')}:${address}`
            }
            return linkForQR
        } catch (e) {
            Log.err('ReceiveScreen.getDataForQR error', e.message)
        }

    }

    proceedAction = async (ways, wayType, callback) => {
        const { currencyCode, currencySymbol, network } = this.props.cryptoCurrency
        try {
            // @misha is it dict setting?
            if (network === 'testnet' || network === 'ropsten') {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.infoBuyModal.notAvailable')
                })
                return
            }

            await Netinfo.isInternetReachable(-120)

            const isExist = ways.find(item => item.outCurrencyCode === currencyCode && item.exchangeWayType === wayType)

            if (typeof isExist !== 'undefined') {
                callback()
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.infoBuyModal.currencyNotAvailable', { currencySymbol })
                })
            }

            setLoaderStatus(false)

        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log(e.message)
            } else {
                // noinspection ES6MissingAwait
                Log.err('ReceiveScreen.proceedAction error ' + e.message)
            }
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: strings('toast.noInternet')
            })
        }

        setLoaderStatus(false)
    }

    handleBuy = () => {
        const { exchangeStore } = this.props

        if (typeof exchangeStore.tradeApiConfig.exchangeWays === 'undefined' || !exchangeStore.tradeApiConfig.exchangeWays) {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: strings('toast.noInternet')
            })
            return false
        }

        this.proceedAction(exchangeStore.tradeApiConfig.exchangeWays, 'BUY', () => {

            ExchangeActions.handleSetTradeType({ tradeType: 'BUY' })

            NavStore.goNext('TradeScreenStack', {
                exchangeScreenParam: {
                    selectedCryptocurrency: this.props.cryptoCurrency
                }
            })
        })
    }

    handleExchange = () => {

        try {
            setLoaderStatus(true)

            NavStore.goNext('ExchangeScreenStack',
                {
                    exchangeScreenParam: {
                        selectedOutCurrency: this.props.cryptoCurrency
                    }
                })
        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err('ReceiveScreen.handleExchange error ' + e.message)
            setLoaderStatus(false)
        }
    }

    handleCustomReceiveAmount = () => {
        const { currencyCode, currencySymbol } = this.props.cryptoCurrency
        const address = this.getAddress()

        showModal({
            type: 'CUSTOM_RECEIVE_AMOUNT_MODAL',
            data: {
                title: strings('account.receiveScreen.receiveAmount'),
                address,
                currencySymbol,
                currencyCode
            }
        })
    }

    shareAddress = () => {
        const { currencySymbol } = this.props.cryptoCurrency

        const address = this.getAddress()

        try {
            setLoaderStatus(true)
            this.refSvg.toDataURL(async (data) => {

                const message = `${currencySymbol}
                ${address}`
                if (Platform.OS === 'android') {
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: `data:image/png;base64,${data}` })
                } else {
                    const fs = new FileSystem()
                    await (fs.setFileEncoding('base64').setFileName('QR').setFileExtension('jpg')).writeFile(data)
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: await fs.getPathOrBase64() })
                }
                setLoaderStatus(false)
            })
        } catch (e) {
            setLoaderStatus(false)
            showModal({
                type: 'CUSTOM_RECEIVE_AMOUNT_MODAL',
                data: {
                    title: JSON.stringify(e)
                }
            })
        }
    }

    renderAccountDetail = () => {

        const { currencySymbol, currencyName, currencyCode } = this.props.cryptoCurrency
        const account = this.props.account

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({
            account,
            cryptoCurrency: this.props.cryptoCurrency
        })

        const currencyAmountPrep = BlocksoftPrettyNumbers.makeCut(account.balancePretty).separated

        return (
            <View style={styles.accountDetail}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View>
                        <CurrencyIcon currencyCode={currencyCode}
                                      containerStyle={{}}/>
                    </View>
                    <View style={styles.accountDetail__content}>
                        <View style={{ paddingRight: 180 }}>
                            <Text style={styles.accountDetail__title} numberOfLines={1}>
                                {currencyName}
                            </Text>
                            {
                                isSynchronized ?
                                    <View style={{ alignItems: 'flex-start' }}>
                                        <LetterSpacing text={currencyAmountPrep + ' ' + currencySymbol}
                                                       textStyle={styles.accountDetail__text} letterSpacing={1}/>
                                    </View>
                                    :
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Loader size={12} color={'#999999'}/>
                                        <View style={{ marginLeft: 10 }}>
                                            <LetterSpacing text={strings('homeScreen.synchronizing')}
                                                           textStyle={styles.accountDetail__text} letterSpacing={.5}/>
                                        </View>
                                    </View>
                            }
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    changeAddressType = async () => {
        try {
            setLoaderStatus(true)
            const setting = await walletActions.setSelectedSegwitOrNot()
            await setSelectedAccount(setting)
            settingsActions.getSetting('btc_legacy_or_segwit').then(res => this.setState({ settingAddressType: res }))
            setLoaderStatus(false)
        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err('ReceiveScreen.changeAddressType error ' + e.message)
        }
    }

    renderSegWitLegacy = () => {

        try {
            const { settingAddressType } = this.state
            const { cryptoCurrency, settingsStore } = this.props

            const dict = new UIDict(cryptoCurrency.currencyCode)
            const backgroundColor = dict.settings.colors.mainColor
            return (
                <View style={{ flexDirection: 'row', width: '100%' }}>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 36 }} disabled={settingAddressType === 'segwit'} onPress={this.changeAddressType}>
                        <Text style={{
                            fontFamily: 'Montserrat-Bold',
                            fontSize: 12,
                            color: settingAddressType === 'segwit' ? dict.settings.colors.mainColor : '#404040'
                        }}>SegWit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 36 }} disabled={settingAddressType === 'legacy'} onPress={this.changeAddressType}>
                        <Text style={{
                            fontFamily: 'Montserrat-Bold',
                            fontSize: 12,
                            color: settingAddressType === 'legacy' ? dict.settings.colors.mainColor : '#404040'
                        }}>Legacy</Text>
                    </TouchableOpacity>
                </View>
            )
        } catch (e) {
            Log.err('ReceiveScreen.renderSegWitLegacy error ' + e.message)
        }
    }

    changeAddress = async () => {
        setLoaderStatus(true)

        try {
            const address = this.getAddress()
            const res = await walletHDActions.setSelectedAccountAsUsed(address)
            if (res) {
                showModal({
                    type: 'YES_NO_MODAL',
                    icon: 'WARNING',
                    title: strings('modal.useAgainAddresses.title'),
                    description: strings('modal.useAgainAddresses.description')
                }, (res) => {
                    walletHDActions.backUnusedAccounts()
                })
            }
        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err('ReceiveScreen changeAddress error ' + e.message)
        }
        setLoaderStatus(false)
    }

    render() {
        const { mainStore, settingsStore } = this.props
        const { isSegWitLegacy } = this.state
        const { address } = this.props.account
        const { currencySymbol, currencyCode } = this.props.cryptoCurrency
        const { btcShowTwoAddress = 0 } = settingsStore.data

        // noinspection ES6MissingAwait
        firebase.analytics().setCurrentScreen('Account.ReceiveScreen')

        const dict = new UIDict(currencyCode)
        const color = dict.settings.colors.mainColor

        const btcAddress = typeof settingsStore.data.btc_legacy_or_segwit !== 'undefined' && settingsStore.data.btc_legacy_or_segwit === 'segwit' ? this.props.account.segwitAddress : this.props.account.legacyAddress

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={strings('account.receiveScreen.title', { receive: strings('repeat.receive') + ' ' + currencySymbol })}
                    CustomComponent={this.renderAccountDetail}
                />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.wrapper__content}>
                        <View style={styles.qr}>
                            <GradientView style={[styles.qr__content, currencyCode === 'BTC' && +btcShowTwoAddress ? null : { paddingTop: 12 }]}
                                          array={styles.qr__bg.array} start={styles.qr__bg.start}
                                          end={styles.qr__bg.end}>
                                {currencyCode === 'BTC' && +btcShowTwoAddress ? this.renderSegWitLegacy() : null}
                                <TouchableOpacity style={{
                                    position: 'relative',
                                    paddingHorizontal: 10,
                                    alignItems: currencyCode === 'BTC' && mainStore.selectedWallet.walletIsHd ? 'flex-start' : 'center'
                                }} onPress={() => this.copyToClip()}>
                                    <QrCodeBox
                                        getRef={ref => this.refSvg = ref}
                                        value={this.getAddressForQR()}
                                        size={200}
                                        color='#404040'
                                        logo={qrLogo}
                                        logoSize={70}
                                        logoBackgroundColor='transparent'
                                        onError={(e) => {
                                            Log.err('ReceiveScreen QRCode error ' + e.message)
                                        }}
                                    />
                                    <View style={{ width: 200, marginTop: 10 }}>
                                        <LetterSpacing text={currencyCode === 'BTC' ? btcAddress : address} numberOfLines={2} containerStyle={{
                                            flexWrap: 'wrap',
                                            justifyContent: currencyCode === 'BTC' && mainStore.selectedWallet.walletIsHd ? 'flex-start' : 'center'
                                        }} textStyle={{ ...styles.accountDetail__text, textAlign: 'center' }}
                                                       letterSpacing={1}/>
                                    </View>
                                    {
                                        currencyCode === 'BTC' && mainStore.selectedWallet.walletIsHd ?
                                            <TouchableOpacity onPress={this.changeAddress} style={{
                                                position: 'absolute',
                                                bottom: -7,
                                                right: 10,
                                                padding: 10
                                            }}>
                                                <FontAwesome color="#F79E1B" size={20} name={'refresh'}/>
                                            </TouchableOpacity> : <View style={{ position: 'absolute', bottom: 7, right: 18 }}><MaterialIcons color="#999999" size={14} name={'content-copy'}/></View>
                                    }
                                </TouchableOpacity>
                                <View style={styles.line}>
                                    <View style={styles.line__item}/>
                                </View>
                                {OldPhone.isOldPhone() ? null : <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <TouchableOpacity style={{ padding: 14, justifyContent: 'center' }}
                                                      onPress={this.handleCustomReceiveAmount}>
                                        <LightButton color={color} Icon={(props) => <Feather color={color} size={10}
                                                                                             name={'edit'} {...props} />}
                                                     title={strings('account.receiveScreen.receiveAmount')}
                                                     iconStyle={{ marginHorizontal: 3 }}/>
                                    </TouchableOpacity>
                                </View> }
                            </GradientView>
                            <View style={styles.qr__shadow}>
                                <View
                                    style={[styles.qr__shadow__item, isSegWitLegacy ? { height: Platform.OS === 'android' ? 406 : 404 } : null]}/>
                            </View>
                        </View>

                            <TouchableOpacity style={{marginTop: 20}}
                                              onPress={NavStore.goNext('FioSendRequest')}>
                                <LightButton color={color} Icon={(props) => <Feather color={color} size={10}
                                                                                 name={'edit'} {...props} />}
                                         title={strings('account.receiveScreen.FIORequest')}
                                         iconStyle={{ marginHorizontal: 3 }}/>
                            </TouchableOpacity>
                        
                        <View style={styles.options}>
                            <TouchableOpacity style={styles.options__item} onPress={this.handleBuy}>
                                <View style={styles.options__wrap}>
                                    <GradientView style={styles.options__content} array={styles.qr__bg.array}
                                                  start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                        <View>
                                            <Fontisto style={{ fontSize: 23, color }} name={'shopping-basket-add'}/>
                                        </View>
                                    </GradientView>
                                    <View style={styles.options__shadow}>
                                        <View style={styles.options__shadow__item}/>
                                    </View>
                                </View>
                                <View style={styles.options__text}>
                                    <LetterSpacing text={strings('exchange.buy')} textStyle={styles.options__text}
                                                   letterSpacing={.7}/>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.options__item} onPress={this.handleExchange}>
                                <View style={styles.options__wrap}>
                                    <GradientView style={styles.options__content} array={styles.qr__bg.array}
                                                  start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                        <CustomIcon name="exchange" style={{ color, fontSize: 24 }}/>
                                    </GradientView>
                                    <View style={styles.options__shadow}>
                                        <View style={styles.options__shadow__item}/>
                                    </View>
                                </View>
                                <View style={styles.options__text}>
                                    <LetterSpacing text={strings('dashboardStack.exchange')}
                                                   textStyle={styles.options__text} letterSpacing={.7}/>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.options__item} onPress={this.shareAddress}>
                                <View style={styles.options__wrap}>
                                    <GradientView style={styles.options__content} array={styles.qr__bg.array}
                                                  start={styles.qr__bg.start} end={styles.qr__bg.end}>
                                        <View style={{ marginRight: 3 }}>
                                            <Fontisto color={color} size={23} name={'share'}/>
                                        </View>
                                    </GradientView>
                                    <View style={styles.options__shadow}>
                                        <View style={styles.options__shadow__item}/>
                                    </View>
                                </View>
                                <View style={styles.options__text}>
                                    <LetterSpacing text={strings('account.receiveScreen.share')}
                                                   textStyle={styles.options__text} letterSpacing={.7}/>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
        exchangeStore: state.exchangeStore,
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReceiveScreen)

const styles_ = {
    array: ['#f5f5f5', '#f5f5f5'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}
