/**
 * @version 0.31
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native'

import Feather from 'react-native-vector-icons/Feather'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import LottieView from 'lottie-react-native'

import NavStore from '@app/components/navigation/NavStore'

import LetterSpacing from '@app/components/elements/LetterSpacing'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import LightButton from '@app/components/elements/LightButton'
import CustomIcon from '@app/components/elements/CustomIcon'
import Loader from '@app/components/elements/LoaderItem'

import { strings } from '@app/services/i18n'

import Toast from '@app/services/UI/Toast/Toast'
import Netinfo from '@app/services/Netinfo/Netinfo'
import Log from '@app/services/Log/Log'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import { FileSystem } from '@app/services/FileSystem/FileSystem'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '@app/appstores/Stores/Main/MainStoreActions'
import walletHDActions from '@app/appstores/Actions/WalletHDActions'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'

import { HIT_SLOP } from '@app/themes/HitSlop'

import qrLogo from '@app/assets/images/logoWithWhiteBG.png'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'

import UIDict from '@app/services/UIDict/UIDict'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import QrCodeBox from '@app/components/elements/QrCodeBox'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { resolveChainCode } from '@crypto/blockchains/fio/FioUtils'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import Buttons from '@app/components/elements/new/buttons/Buttons'
import Tabs from '@app/components/elements/new/Tabs'

import AmountInput from './elements/AccountReceiveInput'
import { normalizeInputWithDecimals } from '@app/services/UI/Normalize/NormalizeInput'

import UtilsService from '@app/services/UI/PrettyNumber/UtilsService'
import TextInput from '@app/components/elements/new/TextInput'
import Button from '@app/components/elements/new/buttons/Button'

import blackLoader from '@app/assets/jsons/animations/refreshBlack.json'
import whiteLoader from '@app/assets/jsons/animations/refreshWhite.json'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import AsyncStorage from '@react-native-community/async-storage'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

const amountInput = {
    id: 'value',
    type: 'AMOUNT',
    additional: 'NUMBER',
    mark: 'ETH'
}

class AccountReceiveScreen extends React.PureComponent {

    constructor() {
        super()
        this.state = {
            settingAddressType: '',

            customAmount: false,

            amountEquivalent: null,
            amountInputMark: '',
            amountForQr: '0',
            labelForQr: '',
            inputType: 'CRYPTO',

            focused: false,

            changeAddress: false,

            isBalanceVisible: false,
            originalVisibility: false,
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        this.getBalanceVisibility()
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
            Log.err('AccountReceiveScreen.copyToClip error', e.message)
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
        Log.log('AccountReceiveScreen.getAddress ' + address, { address, legacyAddress, segwitAddress, settingAddressType })
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
            Log.err('AccountReceiveScreen.getDataForQR error', e.message)
        }

    }

    handleExchange = async () => {

        try {
            await Netinfo.isInternetReachable()

            // if (config.exchange.mode === 'PROD') {
            //     NavStore.goNext('ExchangeV3ScreenStack')
            // } else {
            let showMsg = await AsyncStorage.getItem('smartSwapMsg')
            showMsg = showMsg ? JSON.parse(showMsg) : false

            if (typeof showMsg === 'undefined' || !showMsg) {
                showModal({
                    type: 'MARKET_MODAL',
                    icon: 'INFO',
                    title: strings('modal.marketModal.title'),
                    description: strings('modal.marketModal.description'),
                }, () => {
                    NavStore.goNext('MarketScreen', { side: 'IN', currencyCode: this.props.account.currencyCode })
                })
            } else {
                NavStore.goNext('MarketScreen', { side: 'IN', currencyCode: this.props.account.currencyCode })
            }
            // }
        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('AccountReceiveScreen.handleExchange error ' + e.message)
            } else {
                Log.err('AccountReceiveScreen.handleExchange error ' + e.message)
            }
        }
    }

    handleCustomReceiveAmount = () => {

        this.setState({
            customAmount: true
        })
    }

    handleFioRequestCreate = () => {
        const { currencyCode, currencySymbol } = this.props.cryptoCurrency
        const { fioName } = this.state
        const address = this.getAddress()
        const chainCode = resolveChainCode(currencyCode, currencySymbol)

        NavStore.goNext('FioSendRequest', {
            fioRequestDetails: {
                fioName,
                address,
                chainCode,
                currencySymbol
            }
        })
    }

    shareData = () => {
        const { currencySymbol } = this.props.cryptoCurrency

        const address = this.getAddress()

        try {
            setLoaderStatus(true)
            this.refSvg.toDataURL(async (data) => {
                const message = `${currencySymbol} \n${address}`

                if (Platform.OS === 'android') {
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: `data:image/png;base64,${data}`, title: 'QR', type: 'image/png' })
                } else {
                    const fs = new FileSystem({ fileEncoding: 'base64', fileName: 'QR', fileExtension: 'jpg' })
                    await fs.writeFile(data)
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
        const { balanceTotalPretty, basicCurrencyBalanceTotal, basicCurrencySymbol } = this.props.account
        const { isBalanceVisible, originalVisibility } = this.state

        const { colors } = this.context

        const isSynchronized = currencyActions.checkIsCurrencySynchronized({
            account: this.props.account,
            cryptoCurrency: this.props.cryptoCurrency
        })

        const amountPrep = BlocksoftPrettyNumbers.makeCut(balanceTotalPretty).cutted
        let sumPrep = amountPrep + ' ' + currencySymbol
        try {
            sumPrep += ' / ~' + basicCurrencySymbol + ' ' + basicCurrencyBalanceTotal
        } catch (e) {
            Log.err('Send.SendScreen renderAccountDetail error ' + e.message)
        }

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View>
                    <CurrencyIcon currencyCode={currencyCode}
                        containerStyle={{}} />
                </View>
                <View style={styles.accountDetail__content}>
                    <View style={{}}>
                        <Text style={{ ...styles.accountDetail__title, color: colors.common.text1 }} numberOfLines={1}>
                            {currencyName}
                        </Text>
                        {
                            isSynchronized ?
                                <View style={{ alignItems: 'flex-start' }}>
                                    <TouchableOpacity
                                        onPressIn={() => this.triggerBalanceVisibility(true)}
                                        onPressOut={() => this.triggerBalanceVisibility(false)}
                                        activeOpacity={1}
                                        disabled={originalVisibility}
                                        hitSlop={{ top: 10, right: isBalanceVisible ? 60 : 30, bottom: 10, left: isBalanceVisible ? 60 : 30 }}
                                    >
                                        {isBalanceVisible ?
                                            <LetterSpacing text={sumPrep} textStyle={{ ...styles.accountDetail__text, color: '#999999', height: Platform.OS === 'ios' ? 15 : 18, fontSize: 14 }} letterSpacing={1} /> :
                                            <Text style={{ ...styles.accountDetail__text, color: colors.common.text1, height: Platform.OS === 'ios' ? 15 : 18, fontSize: 24 }}>
                                                ****</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                                :
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Loader size={12} color={'#999999'} />
                                    <View style={{ marginLeft: 10 }}>
                                        <LetterSpacing text={strings('homeScreen.synchronizing')}
                                            textStyle={{ ...styles.accountDetail__text, color: '#999999' }} letterSpacing={.5} />
                                    </View>
                                </View>
                        }
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
            Log.err('AccountReceiveScreen.changeAddressType error ' + e.message)
        }
    }

    renderTabs = (tabs) => {
        const { GRID_SIZE } = this.context
        return (
            <View style={{ width: 200, height: 50, alignSelf: 'center', marginTop: -GRID_SIZE }} >
                <Tabs tabs={tabs} changeTab={this.changeAddressType} />
            </View>
        )
    }

    renderSegWitLegacy = () => {

        try {
            const { settingAddressType } = this.state

            const tabs = [
                {
                    title: 'SegWit',
                    index: 0,
                    active: settingAddressType === 'segwit' ? true : false,
                    hasNewNoties: false,
                    group: null
                },
                {
                    title: 'Legacy',
                    index: 1,
                    active: settingAddressType === 'legacy' ? true : false,
                    hasNewNoties: false,
                    group: null
                },
            ]

            return (
                <>
                    {this.renderTabs(tabs)}
                </>
            )
        } catch (e) {
            Log.err('AccountReceiveScreen.renderSegWitLegacy error ' + e.message)
        }
    }

    changeAddress = async () => {

        this.setState({
            changeAddress: true
        })

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
            Log.err('AccountReceiveScreen changeAddress error ' + e.message)
        }

        setLoaderStatus(false)

        this.setState({
            changeAddress: false
        })
    }

    backAction = () => {
        const { customAmount } = this.state

        if (customAmount) {
            this.setState({
                customAmount: false,
                amountEquivalent: null,
                amountInputMark: '',
                amountForQr: '',
                labelForQr: '',
                inputType: 'CRYPTO'

            })
        } else {
            NavStore.goBack()
        }
    }

    closeAction = () => {
        NavStore.reset('HomeScreen')
    }

    renderButton = (item) => {
        return (
            <Buttons
                data={item}
                title={true}
            />
        )
    }

    amountInputCallback = (value) => {
        const { currencySymbol, currencyCode } = this.props.mainStore.selectedCryptoCurrency
        const { basicCurrencyCode, basicCurrencyRate } = this.props.mainStore.selectedAccount

        let amount = '0'
        let symbol = currencySymbol
        try {
            if (!value || value === 0) {
                amount = '0'
                symbol = this.state.inputType === 'CRYPTO' ? basicCurrencyCode : currencySymbol
            } else if (this.state.inputType === 'CRYPTO') {
                amount = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                symbol = basicCurrencyCode
            } else {
                amount = RateEquivalent.div({ value, currencyCode, basicCurrencyRate })
            }
        } catch (e) {
            Log.log('SendScreen equivalent error ' + e.message)
        }

        const amountForQr = this.state.inputType === 'CRYPTO' ? value : amount

        this.setState({
            amountEquivalent: this.state.inputType === 'CRYPTO' ? UtilsService.cutNumber(amount, 2) : UtilsService.cutNumber(amount, 8),
            amountInputMark: this.state.inputType === 'CRYPTO' ? `~ ${UtilsService.cutNumber(amount, 2)} ${basicCurrencyCode}` : `~ ${UtilsService.cutNumber(amount, 8)} ${symbol}`,
            amountForQr
        })
    }

    handleChangeEquivalentType = () => {
        const { currencySymbol } = this.props.cryptoCurrency
        const { basicCurrencyCode } = this.props.account

        const inputType = this.state.inputType === 'CRYPTO' ? 'FIAT' : 'CRYPTO'

        let amountEquivalent

        const toInput = (!(1 * this.state.amountEquivalent) ? '' : this.state.amountEquivalent).toString()
        const toEquivalent = !this.refAmountInput.getValue() ? '' : this.refAmountInput.getValue()

        if (inputType === 'FIAT') {
            amountEquivalent = toEquivalent
            this.refAmountInput.handleInput(toInput)
        } else {
            amountEquivalent = toEquivalent
            this.refAmountInput.handleInput(toInput)
        }

        const amountForQr = this.state.inputType === 'CRYPTO' ? this.refAmountInput.getValue() : amountEquivalent

        this.setState({
            amountInputMark: this.state.inputType === 'FIAT' ?
                `~ ${UtilsService.cutNumber(this.refAmountInput.getValue(), 2)} ${basicCurrencyCode}` :
                `~ ${UtilsService.cutNumber(amountEquivalent, 8)} ${currencySymbol}`,
            amountEquivalent: this.state.inputType !== 'CRYPTO' ? UtilsService.cutNumber(amountEquivalent, 2) : UtilsService.cutNumber(amountEquivalent, 8),
            inputType,
            amountForQr
        })
    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: Platform.OS === 'android' ? 250 : 180 })
            } catch (e) {
            }
        }, 500)
    }

    getDataForQR = (amount, label) => {
        try {
            const { currencySymbol, currencyCode } = this.props.cryptoCurrency
            let address

            amount = this.state.customAmount ? amount : ''

            if (currencyCode === 'BTC' || currencyCode === 'LTC') {
                address = this.state.settingAddressType === 'segwit' ? this.props.account.segwitAddress : this.props.account.legacyAddress
            } else {
                address = this.props.account.address
            }

            const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            let linkForQR = ''

            if (typeof extend.addressCurrencyCode !== 'undefined') {
                let currencyName = BlocksoftDict.Currencies[extend.addressCurrencyCode].currencyName
                currencyName = currencyName.toLowerCase().replace(' ', '')

                linkForQR = `${currencyName}:${address}?contractAddress=${extend.tokenAddress}&symbol=${currencySymbol}${amount ? `&amount=${amount}` : ''}${label ? `&label=${label}` : ''}`
            } else {
                linkForQR = `${extend.currencyName.toLowerCase().replace(' ', '')}:${address}${amount ? `?amount=${amount}` : ''}${label ? `&label=${label}` : ''}`
            }

            return linkForQR
        } catch (e) {
            Log.err('CustomReceiveAmountModal/getDataForQR error', e.message)
        }
    }

    createDataForQr = (amount, label) => {

        const tmpValue = normalizeInputWithDecimals(amount, 10)

        const dataForQr = this.getDataForQR(tmpValue, label)

        let tmp = false
        if (dataForQr && typeof dataForQr !== 'undefined' && dataForQr !== null) {
            tmp = JSON.stringify(dataForQr)
            if (tmp) {
                tmp = tmp.replace(/"/g, '')
            }
        }

        return tmp
    }

    getBalanceVisibility = () => {
        const originalVisibility = this.props.settingsStore.data.isBalanceVisible
        this.setState(() => ({ originalVisibility, isBalanceVisible: originalVisibility }))
    }

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }

    render() {
        const { mainStore, settingsStore } = this.props
        const { fioName, customAmount, amountForQr, labelForQr, inputType } = this.state
        const { address, basicCurrencyCode } = this.props.account
        const { currencySymbol, currencyCode, decimals } = this.props.cryptoCurrency

        MarketingAnalytics.setCurrentScreen('Account.ReceiveScreen')

        const { colors, GRID_SIZE, isLight } = this.context

        const dict = new UIDict(currencyCode)
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']

        const btcAddress = typeof settingsStore.data.btc_legacy_or_segwit !== 'undefined' && settingsStore.data.btc_legacy_or_segwit === 'segwit' ?
            this.props.account.segwitAddress : this.props.account.legacyAddress

        const buttonsArray = [
            { icon: 'edit', title: strings('account.receiveScreen.amount'), action: () => this.handleCustomReceiveAmount() },
            { icon: 'exchange', title: strings('dashboardStack.exchange'), action: () => this.handleExchange() },
            { icon: 'share', title: strings('account.receiveScreen.share'), action: () => this.shareData() }
        ]

        const notEquivalentValue = this.state.amountInputMark ? this.state.amountInputMark : '0.00'

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.backAction}
                rightType='close'
                rightAction={this.closeAction}
                title={strings('account.receiveScreen.title', { receive: strings('repeat.receive') + ' ' + currencySymbol })}
                ExtraView={this.renderAccountDetail}
            >
                <ScrollView
                    ref={(ref) => {
                        this.scrollView = ref
                    }}
                    keyboardShouldPersistTaps={'handled'}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        minHeight: WINDOW_HEIGHT
                    }}
                >
                    <View style={{ ...styles.wrapper__content, marginTop: GRID_SIZE * 2 }}>
                        {currencyCode === 'BTC' || currencyCode === 'LTC' ? this.renderSegWitLegacy() : null}
                        <View style={styles.qr}>
                            <QrCodeBox
                                getRef={ref => this.refSvg = ref}
                                value={customAmount ? this.createDataForQr(amountForQr, labelForQr) : this.getAddressForQR()}
                                size={200}
                                color='#404040'
                                backgroundColor={'#F5F5F5'}
                                logo={qrLogo}
                                logoSize={70}
                                logoBackgroundColor='transparent'
                                onError={(e) => {
                                    Log.err('AccountReceiveScreen QRCode error ' + e.message)
                                }}
                            />
                        </View>
                        {fioName ? <Text>{fioName}</Text> : null}
                    </View>
                    {customAmount ?
                        <View style={{ marginHorizontal: GRID_SIZE, height: 400 }} >
                            <View style={{ width: '75%', alignSelf: 'center', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <AmountInput
                                        ref={component => this.refAmountInput = component}
                                        id={amountInput.id}
                                        additional={amountInput.additional}
                                        onFocus={() => this.onFocus()}
                                        type={amountInput.type}
                                        decimals={decimals < 10 ? decimals : 10}
                                        callback={(value) => this.amountInputCallback(value, true)}
                                        maxLength={17}
                                        maxWidth={SCREEN_WIDTH * 0.6}
                                    />
                                    <Text style={{ ...styles.ticker, color: colors.sendScreen.amount }}>
                                        {inputType === 'CRYPTO' ? currencyCode : basicCurrencyCode}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                <View style={{ ...styles.line, backgroundColor: colors.sendScreen.colorLine }} />
                                <TouchableOpacity style={{ position: 'absolute', right: 10, marginTop: -4 }}
                                    onPress={this.handleChangeEquivalentType} hitSlop={HIT_SLOP} >
                                    <CustomIcon name={'changeCurrency'} color={colors.common.text3} size={20} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                <LetterSpacing text={notEquivalentValue} textStyle={{ ...styles.notEquivalentValue, color: '#999999' }}
                                    letterSpacing={1.5} />
                            </View>
                            <View style={{ marginVertical: GRID_SIZE }}>
                                <TextInput
                                    value={this.state.labelForQr}
                                    placeholder={strings('send.setting.note')}
                                    onChangeText={(value) => this.setState({ labelForQr: value })}
                                    onFocus={() => this.onFocus()}
                                />
                            </View>
                            <View style={{ alignSelf: 'center', width: '100%', marginTop: GRID_SIZE }}>
                                <Button
                                    title={strings('account.receiveScreen.share')}
                                    onPress={this.shareData}
                                />
                            </View>
                        </View>
                        :
                        <>
                            <View style={{ ...styles.backgroundAddress, backgroundColor: colors.transactionScreen.backgroundItem, marginHorizontal: GRID_SIZE }} >
                                <TouchableOpacity style={{
                                    position: 'relative',
                                    alignItems: 'center'
                                }} onPress={() => this.copyToClip()}
                                    hitSlop={HIT_SLOP}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                        <View style={{ flex: 1, marginHorizontal: GRID_SIZE }} >
                                            <LetterSpacing text={currencyCode === 'BTC' || currencyCode === 'LTC' ? btcAddress : address} numberOfLines={2} containerStyle={{
                                                flexWrap: 'wrap',
                                                justifyContent: 'center'
                                            }} textStyle={{ ...styles.accountDetail__text, textAlign: 'center', color: colors.common.text1 }}
                                                letterSpacing={1} />
                                        </View>
                                        {
                                            currencyCode === 'BTC' && mainStore.selectedWallet.walletIsHd ?
                                                <TouchableOpacity onPress={this.changeAddress} style={{
                                                    position: 'relative',
                                                    marginRight: GRID_SIZE,
                                                    marginTop: 4
                                                }}>
                                                    {this.state.changeAddress ?
                                                        <LottieView style={{ width: 20, height: 20, }}
                                                            source={isLight ? blackLoader : whiteLoader}
                                                            autoPlay loop /> :
                                                        <CustomIcon color={colors.common.text1} size={20} name={'reloadTx'} />
                                                    }
                                                </TouchableOpacity> :
                                                <View style={{ position: 'relative', marginRight: GRID_SIZE, flexDirection: 'column', justifyContent: 'center' }}>
                                                    <MaterialIcons color="#999999" size={14} name={'content-copy'} />
                                                </View>
                                        }
                                    </View>
                                </TouchableOpacity>
                            </View>
                            {
                                fioName ? (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <TouchableOpacity style={{ marginTop: 20 }}
                                            onPress={this.handleFioRequestCreate}>
                                            <LightButton color={color} Icon={(props) => <Feather color={color} size={10}
                                                name={'edit'} {...props} />}
                                                title={strings('account.receiveScreen.FIORequest')}
                                                iconStyle={{ marginHorizontal: 3 }} />
                                        </TouchableOpacity>
                                    </View>
                                ) : null
                            }
                            <View style={{ height: 180, paddingTop: 50, alignSelf: 'center' }}>
                                {this.renderButton(buttonsArray)}
                            </View>
                        </>
                    }
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
        settingsStore: state.settingsStore,
        wallet: state.mainStore.selectedWallet,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

AccountReceiveScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(AccountReceiveScreen)

const styles = {
    wrapper: {
        flex: 1
    },
    wrapper__content: {
        alignItems: 'center',
    },
    qr: {
        position: 'relative',
        backgroundColor: '#F5F5F5',
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,

    },
    options: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        width: 290,
        marginTop: 32,
        marginBottom: 30
    },
    accountDetail__content: {
        flexDirection: 'row',

        marginLeft: 16
    },
    accountDetail__title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 18,
    },
    accountDetail__text: {
        fontSize: 15,
        fontFamily: 'SFUIDisplay-Semibold',
    },
    backgroundAddress: {
        marginTop: 22,
        borderRadius: 16,
        minHeight: 74,
        alignItems: 'center',
        justifyContent: 'center'
    },
    ticker: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 15,
        lineHeight: 19,

        alignSelf: 'flex-end',
        marginBottom: 8,
        paddingLeft: 6
    },
    line: {
        height: 1,
        width: '75%',
        alignSelf: 'center',
        marginVertical: 6
    },
}
