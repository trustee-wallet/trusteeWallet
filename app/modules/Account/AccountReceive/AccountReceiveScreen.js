/**
 * @version 0.43
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import { View, Text, ScrollView, Platform, Dimensions, Linking } from 'react-native'
import { Portal, PortalHost } from '@gorhom/portal'

import Feather from 'react-native-vector-icons/Feather'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import NavStore from '@app/components/navigation/NavStore'

import LetterSpacing from '@app/components/elements/LetterSpacing'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import LightButton from '@app/components/elements/LightButton'
import CustomIcon from '@app/components/elements/CustomIcon'
import Loader from '@app/components/elements/LoaderItem'
import SheetBottom from '@app/components/elements/SheetBottom/SheetBottom'

import { strings } from '@app/services/i18n'

import Toast from '@app/services/UI/Toast/Toast'
import Netinfo from '@app/services/Netinfo/Netinfo'
import Log from '@app/services/Log/Log'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import { FileSystem } from '@app/services/FileSystem/FileSystem'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import { HIT_SLOP } from '@app/theme/HitSlop'

import qrLogo from '@assets/images/logoWithWhiteBG.png'

import UIDict from '@app/services/UIDict/UIDict'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import QrCodeBox from '@app/components/elements/QrCodeBox'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { resolveChainCode } from '@crypto/blockchains/fio/FioUtils'

import { ThemeContext } from '@app/theme/ThemeProvider'

import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import Tabs from '@app/components/elements/new/TabsWithUnderlineOld'

import AmountInput from './elements/AccountReceiveInput'
import { normalizeInputWithDecimals } from '@app/services/UI/Normalize/NormalizeInput'

import UtilsService from '@app/services/UI/PrettyNumber/UtilsService'
import Button from '@app/components/elements/new/buttons/Button'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { getIsBalanceVisible, getIsSegwit } from '@app/appstores/Stores/Settings/selectors'
import { getSelectedAccountData, getSelectedCryptoCurrencyData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

import InvoiceListItem from '@app/components/elements/new/list/ListItem/Invoice'
import { getExplorerLink, handleShareInvoice } from '../helpers'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'

import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import { changeAddress, getAddress } from './helpers'

import { changeCurrencyNameToNetwork } from '@crypto/common/BlocksoftQrScanDict'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const amountInput = {
    id: 'value',
    type: 'AMOUNT',
    additional: 'NUMBER',
    mark: 'ETH'
}

let CACHE_ASKED = false

class AccountReceiveScreen extends React.PureComponent {

    state = {
        settingAddressType: false,
        settingAddressTypeTriggered : false,

        customAmount: false,

        amountEquivalent: null,
        amountInputMark: '',
        amountForQr: '0',
        labelForQr: '',
        inputType: 'CRYPTO',

        focused: false,

        isBalanceVisible: false,
        isBalanceVisibleTriggered: false,
        index: 0,
        walletIsHd: false
    }

    async _onLoad() {
        CACHE_ASKED = trusteeAsyncStorage.getExternalAsked()
    }

    componentDidMount() {
        this._onLoad()
        this.setState({
            walletIsHd: this.props.selectedWalletData.walletIsHd
        })
    }

    componentDidUpdate(prevProps) {
        if (prevProps.selectedWalletData.walletIsHd !== this.props.selectedWalletData.walletIsHd) {
            this.setState({
                walletIsHd: true
            })
        }
    }

    handleGetAddress = () => {
        getAddress.call(this)
    }

    copyToClip = () => {
        try {
            copyToClipboard(getAddress.call(this))
            Toast.setMessage(strings('toast.copied')).show()
        } catch (e) {
            Log.err('AccountReceiveScreen.copyToClip error', e.message)
        }

    }

    getAddressForQR = () => {
        const { currencyCode, currencySymbol } = this.props.selectedCryptoCurrencyData

        try {

            const address = getAddress.call(this)

            const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            let linkForQR = ''

            if (typeof extend.tokenBlockchain !== 'undefined' || typeof extend.addressCurrencyCode !== 'undefined') {
                let currencyName = extend?.tokenBlockchain && extend?.tokenBlockchain !== 'undefined' ? ('token_of_' + extend.tokenBlockchain) : BlocksoftDict.Currencies[extend.addressCurrencyCode].currencyName
                currencyName = changeCurrencyNameToNetwork(currencyName, extend.currencyName)
                if (typeof extend.tokenAddress !== 'undefined') {
                    linkForQR = `${currencyName}:${address}?contractAddress=${extend.tokenAddress}&symbol=${currencySymbol}`
                } else if (typeof extend.tokenName !== 'undefined') {
                    linkForQR = `${currencyName}:${address}?contractAddress=${extend.tokenName}&symbol=${currencySymbol}`
                } else {
                    linkForQR = `${currencyName}:${address}?symbol=${currencySymbol}`
                }
            } else {
                linkForQR = `${changeCurrencyNameToNetwork(extend.currencyName)}:${address}`
            }
            return linkForQR
        } catch (e) {
            Log.err('AccountReceiveScreen.getDataForQR error', e.message)
        }

    }

    handleExchange = async () => {
        const { currencyCode } = this.props.selectedCryptoCurrencyData

        try {
            await Netinfo.isInternetReachable()

            const showMsg = trusteeAsyncStorage.getSmartSwapMsg() === '1'
            if (!showMsg) {
                showModal({
                    type: 'MARKET_MODAL',
                    icon: 'INFO',
                    title: strings('modal.marketModal.title'),
                    description: strings('modal.marketModal.description'),
                }, () => {
                    NavStore.goNext('MarketScreen', { side: 'IN', currencyCode })
                })
            } else {
                NavStore.goNext('MarketScreen', { side: 'IN', currencyCode })
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

    handleFioRequestCreate = () => {
        const { currencyCode, currencySymbol } = this.props.selectedCryptoCurrencyData
        const { fioName } = this.state
        const address = getAddress.call(this)
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
        const { currencySymbol } = this.props.selectedCryptoCurrencyData
        const address = getAddress.call(this)

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
        const { currencyCode, currencyName, currencySymbol } = this.props.selectedCryptoCurrencyData
        const { balancePretty, basicCurrencyBalance, basicCurrencySymbol, isSynchronized } = this.props.selectedAccountData
        const isBalanceVisible = this.state.isBalanceVisibleTriggered ? this.state.isBalanceVisible : this.props.isBalanceVisible

        const { colors, GRID_SIZE } = this.context

        const amountPrep = BlocksoftPrettyNumbers.makeCut(balancePretty).separated
        let sumPrep = amountPrep + ' ' + currencySymbol
        try {
            sumPrep += ' / ~' + basicCurrencySymbol + ' ' + basicCurrencyBalance
        } catch (e) {
            Log.err('Send.SendScreen renderAccountDetail error ' + e.message)
        }

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: GRID_SIZE }}>
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
                                    <TouchableDebounce
                                        onPressIn={() => this.triggerBalanceVisibility(true, this.props.isBalanceVisible)}
                                        onPressOut={() => this.triggerBalanceVisibility(false, this.props.isBalanceVisible)}
                                        activeOpacity={1}
                                        disabled={this.props.isBalanceVisible}
                                        hitSlop={{ top: 10, right: isBalanceVisible ? 60 : 30, bottom: 10, left: isBalanceVisible ? 60 : 30 }}
                                    >
                                        {isBalanceVisible ?
                                            <LetterSpacing text={sumPrep} textStyle={{ ...styles.accountDetail__text, color: '#999999', height: Platform.OS === 'ios' ? 15 : 18, fontSize: 14 }} letterSpacing={1} /> :
                                            <Text style={{ ...styles.accountDetail__text, color: colors.common.text1, height: Platform.OS === 'ios' ? 15 : 18, fontSize: 24 }}>
                                                ****</Text>
                                        }
                                    </TouchableDebounce>
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
            const { settingAddressType, settingAddressTypeTriggered } = this.state
            const { isSegwit } = this.props
            const actualIsSegwit = settingAddressTypeTriggered ? (settingAddressType !== 'legacy') : isSegwit
            this.setState({ settingAddressType: actualIsSegwit ? 'legacy' : 'segwit', settingAddressTypeTriggered : true })
        } catch (e) {
            // noinspection ES6MissingAwait
            Log.err('AccountReceiveScreen.changeAddressType error ' + e.message)
        }
    }

    renderTabs = (tabs) => {
        const { GRID_SIZE } = this.context
        return (
            <Tabs
                tabs={tabs}
                changeTab={this.changeAddressType}
                containerStyle={{ marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE / 2 }}
            />
        )
    }

    renderAddressLegacy = (newFormatTitle = 'SegWit', oldFormatTitle = 'Legacy') => {
        // @todo isSegwit also for other new / legacy format switching
        try {
            const { settingAddressType, settingAddressTypeTriggered } = this.state
            const { isSegwit } = this.props
            const actualIsSegwit = settingAddressTypeTriggered ? (settingAddressType !== 'legacy') : isSegwit
            const tabs = [
                {
                    title: newFormatTitle,
                    index: 0,
                    active: actualIsSegwit,
                    hasNewNoties: false,
                    group: null
                },
                {
                    title: oldFormatTitle,
                    index: 1,
                    active: !actualIsSegwit,
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
            Log.err('AccountReceiveScreen.renderAddressLegacy error ' + e.message)
        }
    }

    handleChangeAddress = async () => {
        await changeAddress.call(this)
    }

    backAction = () => {
        NavStore.goBack()
    }

    closeAction = () => {
        NavStore.reset('HomeScreen')
    }

    renderButton = (item) => {

        const { GRID_SIZE } = this.context

        return (
            item.map(i => <BorderedButton text={i.title} onPress={i.action} key={i.title} containerStyles={{ marginHorizontal: GRID_SIZE / 2 }} />)
        )
    }

    amountInputCallback = (value) => {
        const { currencyCode, currencySymbol } = this.props.selectedCryptoCurrencyData
        const { basicCurrencyCode, basicCurrencyRate } = this.props.selectedAccountData
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
        const { currencySymbol } = this.props.selectedCryptoCurrencyData
        const { basicCurrencyCode } = this.props.selectedAccountData

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

    onBlur = () => {
        this.setState({
            focused: false
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 0 })
            } catch (e) {
            }
        }, 500)
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
            const { currencyCode, currencySymbol } = this.props.selectedCryptoCurrencyData
            const address = getAddress.call(this)
            amount = this.state.customAmount ? amount : ''

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

    triggerBalanceVisibility = (value, originalVisibility) => {
        this.setState((state) => ({ isBalanceVisible: value || originalVisibility, isBalanceVisibleTriggered : true }))
    }

    renderModalContent = (address) => {

        const {
            GRID_SIZE,
            colors
        } = this.context

        const { currencyCode, currencyName } = this.props.selectedCryptoCurrencyData

        return(
            <View style={{ marginTop: GRID_SIZE }}>
                <InvoiceListItem
                    title={strings('account.invoiceText')}
                    onPress={() => {
                        handleShareInvoice(getAddress.call(this), currencyCode, currencyName, this.context.isLight)
                        this.handleCloseBackDropModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderRadius: 12, backgroundColor: colors.backDropModal.mainButton, marginBottom: GRID_SIZE }}
                    textColor='#F7F7F7'
                    iconType='invoice'
                    last
                />
                <InvoiceListItem
                    title={strings('account.receiveScreen.amount')}
                    onPress={() => {
                        this.handleCustomAmount()
                        this.handleCloseBackDropModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                    iconType='edit'
                />
                <InvoiceListItem
                    title={strings('account.copyLink')}
                    onPress={() => {
                        this.copyToClip()
                        this.handleCloseBackDropModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE }}
                    iconType='copy'
                />
                <InvoiceListItem
                    title={strings('account.openInBlockchair')}
                    onPress={() => {
                        this.handleOpenLink(address)
                        this.handleCloseBackDropModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
                    iconType='blockchair'
                    last
                />
            </View>
        )
    }

    handleBackDropModal = () => {
        this.bottomSheetRef.open()
    }

    handleCloseBackDropModal = () => {
        this.bottomSheetRef.close()
    }

    handleOpenLink = async (address, forceLink = false) => {
        const now = new Date().getTime()
        const diff = now - CACHE_ASKED * 1
        if (!CACHE_ASKED|| diff > 10000) {
            showModal({
                type: 'YES_NO_MODAL',
                title: strings('account.externalLink.title'),
                icon: 'WARNING',
                description: strings('account.externalLink.description'),
                reverse: true
            }, () => {
                trusteeAsyncStorage.setExternalAsked(now + '')
                CACHE_ASKED = now
                this.actualOpen(address, forceLink)
            })
        } else {
            this.actualOpen(address, forceLink)
        }
    }

    actualOpen = async (address, forceLink = false) => {
        const { currencyCode } = this.props.selectedCryptoCurrencyData

        const actualLink = forceLink || getExplorerLink(currencyCode, 'address', address)
        try {
            const linkUrl = BlocksoftPrettyStrings.makeFromTrustee(actualLink)
            Linking.openURL(linkUrl)
        } catch (e) {
            Log.err('Account.AccountReceiveScreen open URI error ' + e.message, actualLink)
        }

    }

    handleShowAll = () => NavStore.goNext('AllAddressesScreen')

    handleCustomAmount = () => {

        const { customAmount } = this.state

        // TODO animation
        // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

        this.scrollDetails(!customAmount)

        this.setState({
            customAmount: !customAmount,
            amountEquivalent: null,
            amountInputMark: '',
            amountForQr: '',
            labelForQr: '',
            inputType: 'CRYPTO',
            focused: false
        })
    }

    renderCustomAmountCloseBtn = () => {

        const { colors } = this.context

        return(
            <TouchableDebounce
                style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.common.button.bg, alignItems: 'center', justifyContent: 'center'}}
                onPress={this.handleCustomAmount}
            >
                <CustomIcon name='close' size={12} color={colors.common.button.text} />
            </TouchableDebounce>
        )
    }

    scrollDetails = (activeSection) => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: activeSection ? 200 : 0 })
            } catch (e) {
            }
        }, 300)
    }

    render() {

        const { fioName, customAmount, amountForQr, labelForQr, inputType, walletIsHd, focused } = this.state
        const { basicCurrencyCode, address } = this.props.selectedAccountData
        const { currencyCode, currencySymbol, decimals} = this.props.selectedCryptoCurrencyData

        MarketingAnalytics.setCurrentScreen('Account.ReceiveScreen')

        const { colors, GRID_SIZE, isLight } = this.context

        const dict = new UIDict(currencyCode)
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']

        const shownAddress = getAddress.call(this)
        const buttonsArray = [
            { title: strings('settings.walletList.showAll'), action: () => this.handleShowAll() },
            { title: strings('settings.walletList.generateNew'), action: () => this.handleChangeAddress() }
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
                    style={{ paddingTop: GRID_SIZE }}
                >
                    {currencyCode === 'BTC' || currencyCode === 'LTC' ? this.renderAddressLegacy('SegWit') : null}
                    {currencyCode === 'BSV' || currencyCode === 'BCH' ? this.renderAddressLegacy('CashAddr') : null}
                    {currencyCode === 'ONE' ? this.renderAddressLegacy('0x', 'One1') : null}
                    <View style={{backgroundColor: colors.common.listItem.basic.iconBgLight, marginHorizontal: GRID_SIZE, borderRadius: 24, paddingBottom: GRID_SIZE }}>
                        <View style={{ ...styles.wrapper__content, paddingTop: GRID_SIZE * 1.5 }}>

                            <TouchableDebounce
                                style={styles.qr}
                                onPressIn={() => this.handleBackDropModal(shownAddress)}
                                activeOpacity={0.8}
                                onLongPress={this.copyToClip}
                                delayLongPress={500}
                            >
                                <QrCodeBox
                                    getRef={ref => this.refSvg = ref}
                                    value={customAmount ? this.createDataForQr(amountForQr, labelForQr) : this.getAddressForQR()}
                                    size={160}
                                    color='#404040'
                                    backgroundColor='#F5F5F5'
                                    logo={qrLogo}
                                    logoSize={54}
                                    logoBackgroundColor='transparent'
                                    onError={(e) => {
                                        Log.err('AccountReceiveScreen QRCode error ' + e.message)
                                    }}
                                />
                            </TouchableDebounce>
                            {fioName ? <Text>{fioName}</Text> : null}
                        </View>

                            <View style={[styles.backgroundAmount, { marginHorizontal: GRID_SIZE, backgroundColor: colors.cashback.progressBarBg + '80', paddingBottom: customAmount ? GRID_SIZE * 1.5 : 0, marginTop: GRID_SIZE }]}>
                                {customAmount ?
                                    <>
                                        <View style={{ alignItems: 'flex-end', marginTop: GRID_SIZE, marginRight: GRID_SIZE }}>
                                            {this.renderCustomAmountCloseBtn()}
                                        </View>
                                        <View style={{ width: '75%', alignSelf: 'center', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <AmountInput
                                                    ref={component => this.refAmountInput = component}
                                                    id={amountInput.id}
                                                    additional={amountInput.additional}
                                                    onFocus={this.onFocus}
                                                    type={amountInput.type}
                                                    decimals={decimals < 10 ? decimals : 10}
                                                    callback={(value) => this.amountInputCallback(value, true)}
                                                    maxLength={17}
                                                    maxWidth={SCREEN_WIDTH * 0.6}
                                                    focused={focused}
                                                    onBlur={this.onBlur}
                                                />
                                                <Text style={{ ...styles.ticker, color: colors.sendScreen.amount }}>
                                                    {inputType === 'CRYPTO' ? currencyCode : basicCurrencyCode}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                            <View style={{ ...styles.line, backgroundColor: colors.cashback.progressBarBg }} />
                                            <TouchableDebounce style={{ position: 'absolute', right: 10, marginTop: -4 }}
                                                onPress={this.handleChangeEquivalentType}
                                                hitSlop={HIT_SLOP}
                                            >
                                                <CustomIcon name={'changeCurrency'} color={colors.common.text3} size={20} />
                                            </TouchableDebounce>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                            <LetterSpacing text={notEquivalentValue} textStyle={{ ...styles.notEquivalentValue, color: '#999999' }}
                                                letterSpacing={1.5} />
                                        </View>
                                        <View style={{ alignSelf: 'center', marginTop: GRID_SIZE * 2}}>
                                            <Button
                                                type='withoutShadow'
                                                title={strings('account.receiveScreen.share')}
                                                onPress={this.shareData}
                                                containerStyle={[styles.discardButton, { paddingHorizontal: GRID_SIZE * 2, padding: GRID_SIZE / 2, backgroundColor: colors.common.button.bg }]}
                                            />
                                        </View>
                                    </> :
                                    <View style={styles.backgroundAddress}>
                                        <TouchableDebounce
                                            style={{ alignItems: 'center' }}
                                            onPress={() => this.handleBackDropModal(shownAddress)}
                                            hitSlop={HIT_SLOP}
                                            onLongPress={this.copyToClip}
                                            delayLongPress={500}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                                <View style={{ flex: 1, marginHorizontal: GRID_SIZE }} >
                                                    <LetterSpacing text={shownAddress && shownAddress !== '' ? shownAddress : address} numberOfLines={2} containerStyle={{
                                                        flexWrap: 'wrap',
                                                        justifyContent: 'center'
                                                    }} textStyle={{ ...styles.accountDetail__text, textAlign: 'left', color: colors.common.text1 }}
                                                        letterSpacing={1} />
                                                </View>
                                                {
                                                    <View style={{ justifyContent: 'center', marginRight: GRID_SIZE }}>
                                                        <MaterialIcons color={colors.common.text1} size={20} name={'content-copy'} />
                                                    </View>
                                                }
                                            </View>
                                        </TouchableDebounce>
                                    </View>
                                }
                            </View>
                            {!customAmount && <View>
                                { fioName ? (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <TouchableDebounce style={{ marginTop: 20 }}
                                            onPress={this.handleFioRequestCreate}>
                                            <LightButton color={color} Icon={(props) => <Feather color={color} size={10}
                                                name={'edit'} {...props} />}
                                                title={strings('account.receiveScreen.FIORequest')}
                                                iconStyle={{ marginHorizontal: 3 }} />
                                        </TouchableDebounce>
                                    </View>
                                ) : null }
                                {currencyCode === 'BTC' && walletIsHd && <View style={{ alignSelf: 'center', flexDirection: 'row', paddingTop: GRID_SIZE * 1.5 }}>
                                    {this.renderButton(buttonsArray)}
                                </View>}
                            </View>}
                        </View>
                </ScrollView>
                {!customAmount && <Button
                    title={strings('account.receiveScreen.share')}
                    onPress={() => this.handleBackDropModal(shownAddress)}
                    containerStyle={{ marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE }}
                />}
                <Portal>
                    <SheetBottom
                        ref={ref => this.bottomSheetRef = ref}
                        snapPoints={[0, 340]}
                        index={0}
                    >
                        {this.renderModalContent(address)}
                        <Button
                            title={strings('assets.hideAsset')}
                            type='withoutShadow'
                            onPress={this.handleCloseBackDropModal}
                            containerStyle={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE, backgroundColor: colors.backDropModal.buttonBg }}
                            textStyle={{ color: colors.backDropModal.buttonText }}
                            bottomSheet
                        />
                    </SheetBottom>
                </Portal>
                <PortalHost name='receiveScreenPortal' />
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWalletData: getSelectedWalletData(state),
        selectedCryptoCurrencyData: getSelectedCryptoCurrencyData(state),
        selectedAccountData: getSelectedAccountData(state),
        isSegwit: getIsSegwit(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
    }
}
AccountReceiveScreen.contextType = ThemeContext

export default connect(mapStateToProps)(AccountReceiveScreen)

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
        width: 180,
        height: 180,
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
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 74
    },
    backgroundAmount: {
        borderRadius: 16
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
    discardButton: {
        width: 'auto',
        minWidth: 58,
        height: 38
    }
}
