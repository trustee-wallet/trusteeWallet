/**
 * @version 0.43
 */
import React from 'react'
import { Linking, Platform, Text, View } from 'react-native'
import _isEqual from 'lodash/isEqual'
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons'
import { Portal, PortalHost } from '@gorhom/portal'

import GradientView from '@app/components/elements/GradientView'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import Loader from '@app/components/elements/LoaderItem'
import InvoiceListItem from '@app/components/elements/new/list/ListItem/Invoice'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import { ThemeContext } from '@app/theme/ThemeProvider'

import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import checkTransferHasError from '@app/services/UI/CheckTransferHasError/CheckTransferHasError'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { strings } from '@app/services/i18n'

import NavStore from '@app/components/navigation/NavStore'
import CustomIcon from '@app/components/elements/CustomIcon'
import { HIT_SLOP } from '@app/theme/HitSlop'

import AccountGradientBlock from '@app/components/elements/new/AccountGradientBlock'
import { getExplorerLink, handleShareInvoice } from '../helpers'
import PercentView from '@app/components/elements/new/PercentView'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'
import SheetBottom from '@app/components/elements/SheetBottom/SheetBottom'
import Button from '@app/components/elements/new/buttons/Button'

import { setWalletDapp } from '@app/appstores/Stores/WalletDapp/WalletDappStoreActions'
import dappsBlocksoftDict from '@crypto/assets/dappsBlocksoftDict.json'

class HeaderBlocks extends React.Component {

    shouldComponentUpdate(nextProps) {
        return !_isEqual(this.props, nextProps)
    }


    handleOpenLink = async (address, forceLink = false) => {
        const now = new Date().getTime()
        const diff = now - this.props.cacheAsked * 1
        if (!this.props.cacheAsked || diff > 10000) {
            showModal({
                type: 'YES_NO_MODAL',
                title: strings('account.externalLink.title'),
                icon: 'WARNING',
                description: strings('account.externalLink.description'),
                reverse: true
            }, () => {
                trusteeAsyncStorage.setExternalAsked(now + '')
                this.props.cacheAsked = now
                this.actualOpen(address, forceLink)
            })
        } else {
            this.actualOpen(address, forceLink)
        }
    }

    actualOpen = async (address, forceLink = false) => {
        const { currencyCode } = this.props.cryptoCurrency

        const actualLink = forceLink || getExplorerLink(currencyCode, 'address', address)
        try {
            const linkUrl = BlocksoftPrettyStrings.makeFromTrustee(actualLink)
            Linking.openURL(linkUrl)
        } catch (e) {
            Log.err('Account.AccountScreen open URI error ' + e.message, actualLink)
        }

    }

    renderModalContent = (params) => {

        const {
            GRID_SIZE,
            colors,
            isLight
        } = this.context

        return (
            <View style={{ marginTop: GRID_SIZE }}>
                <InvoiceListItem
                    title={strings('account.invoiceText')}
                    onPress={() => {
                        handleShareInvoice(params?.address, params?.currencyCode, params?.currencyName, isLight)
                        this.handleCloseBackDropModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderRadius: 12, backgroundColor: colors.backDropModal.mainButton, marginBottom: GRID_SIZE }}
                    textColor='#F7F7F7'
                    iconType='invoice'
                    last
                />
                <InvoiceListItem
                    title={strings('account.copyLink')}
                    onPress={() => {
                        this.handleBtcAddressCopy(params?.address)
                        this.handleCloseBackDropModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                    iconType='copy'
                />
                <InvoiceListItem
                    title={strings('account.openInBlockchair')}
                    onPress={() => {
                        this.handleOpenLink(params?.address, params?.forceLink)
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
        this.bottomSheetRef?.open()
    }

    handleCloseBackDropModal = () => {
        this.bottomSheetRef?.close()
    }

    handleCopy = (text) => {
        try {
            copyToClipboard(text)
            Toast.setMessage(strings('toast.copied')).show()
        } catch (error) {
            Log.err('Account.AccountScreen copy error ' + error.message)
        }
    }

    handleBtcAddressCopy = (address) => {
        const { cryptoCurrency, account } = this.props
        const { walletHash } = account
        const { currencyCode, currencySymbol } = cryptoCurrency
        checkTransferHasError({
            walletHash,
            currencyCode,
            currencySymbol,
            addressFrom: address,
            addressTo: address
        })
        this.handleCopy(address)
    }

    renderStakeBalance = (availableStaking) => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        const { isBalanceVisible, isBalanceVisibleTriggered, originalVisibility, account } = this.props
        const finalIsBalanceVisible = isBalanceVisibleTriggered ? isBalanceVisible : originalVisibility

        const { currencyCode, currencySymbol, decimals } = this.props.cryptoCurrency

        const canBeStaked = availableStaking // currencyCode === 'TRX' || currencyCode === 'SOL' || currencyCode === 'ETH'
        const withoutDescription = currencyCode === 'SOL' || currencyCode === 'ETH' || currencyCode === 'ETH_MATIC'

        let balanceTotalPretty = account?.balanceTotalPretty || '0'
        let balanceStakedPretty = account?.balanceStakedPretty || '0'
        let balanceStakedTitle = 'settings.walletList.staked'
        let diffAvailable = typeof balanceStakedPretty !== 'undefined' && balanceStakedPretty * 1 !== 0 && balanceStakedPretty !== balanceTotalPretty
        const hodl = BlocksoftBalances.setCurrencyCode(currencyCode).getBalanceHodl(account)
        if (hodl > 0) {
            balanceTotalPretty = BlocksoftUtils.diff(account.balancePretty, hodl)
            if (typeof balanceTotalPretty !== 'undefined' && balanceTotalPretty && balanceTotalPretty?.toString().indexOf('0.0000') !== -1) {
                balanceTotalPretty = '0'
                balanceStakedPretty = 0
            } else if (balanceTotalPretty * 1 < 0) {
                balanceStakedPretty = account.balancePretty
                balanceTotalPretty = 0
            } else {
                balanceStakedPretty = hodl
            }
            diffAvailable = true
            balanceStakedTitle = 'settings.walletList.frozen'
        }

        if (!canBeStaked && !diffAvailable) {
            return <View />
        }

        return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: -GRID_SIZE / 4, alignItems: 'center' }}>
                <TouchableDebounce
                    onPress={() => this.accountStaking(currencyCode)}
                    hitSlop={HIT_SLOP}
                    disabled={!canBeStaked}
                >
                    {diffAvailable &&
                        <Text style={[styles.availableText, { color: colors.common.text3, marginBottom: GRID_SIZE / 3 }]}>
                            {`${strings('settings.walletList.available')}: ${finalIsBalanceVisible ? BlocksoftPrettyNumbers.makeCut(balanceTotalPretty, decimals).cutted + ' ' + currencySymbol : ' ****'}`}
                        </Text>}
                    {!withoutDescription &&
                        <Text style={styles.availableText}>
                            {`${strings(balanceStakedTitle)}: ${finalIsBalanceVisible ? balanceStakedPretty + ' ' + currencySymbol : ' ****'}`}
                        </Text>
                    }
                    {!diffAvailable && withoutDescription ?
                        <Text style={styles.availableText}>
                            {strings('account.staking')}
                        </Text>
                    : null}
                </TouchableDebounce>
                {
                    canBeStaked &&
                    <TouchableDebounce style={{ paddingLeft: 23 }} onPress={() => this.accountStaking(currencyCode)} hitSlop={HIT_SLOP}>
                        <CustomIcon name='staking' size={24} color={colors.common.text1} />
                    </TouchableDebounce>
                }
            </View>
        )
    }

    renderBalance = () => {

        const { colors, GRID_SIZE } = this.context

        const { isBalanceVisible, isBalanceVisibleTriggered, triggerBalanceVisibility, originalVisibility, account } = this.props
        const finalIsBalanceVisible = isBalanceVisibleTriggered ? isBalanceVisible : originalVisibility

        const { isSynchronized, balancePretty, basicCurrencySymbol, basicCurrencyBalance } = account

        let tmp = BlocksoftPrettyNumbers.makeCut(balancePretty, 7, 'AccountScreen/renderBalance').separated
        if (typeof tmp.split === 'undefined') {
            throw new Error('AccountScreen.renderBalance split is undefined')
        }

        tmp = tmp.slice(0, 11)
        const tmps = tmp.split('.')
        let balancePrettyPrep1 = tmps[0]
        let balancePrettyPrep2 = ''
        if (typeof tmps[1] !== 'undefined' && tmps[1]) {
            balancePrettyPrep1 = tmps[0] + '.'
            balancePrettyPrep2 = tmps[1]
        }

        const handlePress = () => {
            const text = balancePrettyPrep1 + balancePrettyPrep2
            this.handleCopy(text)
        }

        const BalanceComponent = () => {
            return (
                <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                    {balancePrettyPrep1}
                    <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                        {balancePrettyPrep2}
                    </Text>
                </Text>
            )
        }

        if (isSynchronized) {
            return (
                <View style={{ ...styles.topContent__top, marginHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE }}>
                    <View style={{ ...styles.topContent__title, flexGrow: 1 }}>
                        <TouchableDebounce
                            onPressIn={() => triggerBalanceVisibility(true, originalVisibility)}
                            onPressOut={() => triggerBalanceVisibility(false, originalVisibility)}
                            activeOpacity={1}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: finalIsBalanceVisible ? 60 : 30, bottom: 10, left: finalIsBalanceVisible ? 60 : 30 }}
                        >
                                {originalVisibility ? (
                                <TouchableDebounce onPress={handlePress}>
                                    <BalanceComponent />
                                </TouchableDebounce>
                            ) : (finalIsBalanceVisible ? (
                                    <BalanceComponent />
                                ) : (
                                    <Text style={[styles.topContent__title_last, styles.hiddenBalance, { color: colors.common.text1 }]}>
                                        ****
                                    </Text>
                                )
                            )}
                        </TouchableDebounce>
                    </View>
                    {finalIsBalanceVisible && (
                        <LetterSpacing
                            text={basicCurrencySymbol + ' ' + basicCurrencyBalance}
                            textStyle={{ ...styles.topContent__subtitle, color: colors.common.text2 }}
                            letterSpacing={.5}
                        />
                    )}
                </View>
            )
        } else {
            return (
                <View style={{ ...styles.topContent__top, marginHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }}>
                    <View style={styles.topContent__title}>
                        <View style={{ height: Platform.OS === 'ios' ? 46 : 51, alignItems: 'center' }}>
                            <Loader size={30} color={colors.accountScreen.loaderColor} />
                        </View>
                    </View>
                </View>
            )
        }
    }

    handleSettingAccount = (currencyCode) => {

        const { colors } = this.context

        return (
            <TouchableDebounce style={{ paddingLeft: 23 }} onPress={() => this.accountSetting(currencyCode)} hitSlop={HIT_SLOP}>
                <View style={{ paddingVertical: 12 }}>
                    <CustomIcon name='coinSettings' size={20} color={colors.common.text1} />
                </View>
            </TouchableDebounce>
        )
    }

    accountSetting = (currencyCode) => {
        if (currencyCode === 'FIO') {
            NavStore.goNext('FioMainSettings')
        } else {
            NavStore.goNext('AccountSettings', { account: currencyCode })
        }
    }

    settings = (currencyCode) => {
        switch (currencyCode) {
            case 'BTC':
            case 'USDT':
            case 'XVG':
            case 'ETC':
            case 'ETH':
            case 'FIO':
            case 'XMR':
            case 'BNB':
            case 'SOL':
            case 'BNB_SMART':
            case 'ONE':
                return this.handleSettingAccount(currencyCode)
            default:
                return null
        }
    }

    renderStakingBtn = (currencyCode) => {
        switch (currencyCode) {
            case 'ETH':
            case 'TRX':
            case 'SOL':
                return this.handleStakingAccount(currencyCode)
            default:
                return null
        }
    }

    accountStaking = (currencyCode) => {
        switch (currencyCode) {
            case 'ETH':
                setWalletDapp(dappsBlocksoftDict['ETH_LIDO'])
                MarketingEvent.logEvent('wallet_dapps_eth_stacking')
                return NavStore.goNext('WalletDappWebViewScreen')
            case 'ETH_MATIC':
                setWalletDapp(dappsBlocksoftDict['MATIC_LIDO'])
                MarketingEvent.logEvent('wallet_dapps_matic_stacking')
                return NavStore.goNext('WalletDappWebViewScreen')
            case 'TRX':
                return NavStore.goNext('AccountStakingTRX')
            case 'SOL':
                return NavStore.goNext('AccountStakingSOL')
            default:
                return null
        }
    }

    render() {
        const { colors, GRID_SIZE } = this.context

        let { account, cryptoCurrency, isSegwit } = this.props
        const { shownAddress, walletPubs } = account
        const { currencyCode, currencySymbol, currencyName } = cryptoCurrency
        let forceLink = false
        if (currencyCode === 'BTC' && walletPubs) {
            isSegwit = isSegwit ? 'btc.84' : 'btc.44'
            if (typeof walletPubs[isSegwit] !== 'undefined' && walletPubs[isSegwit].walletPubValue) {
                forceLink = 'https://blockchair.com/bitcoin/xpub/' + walletPubs[isSegwit].walletPubValue
            }
        }

        const addressPrep = BlocksoftPrettyStrings.makeCut(shownAddress, 6, 6)

        const availableStaking = typeof this.props.stakingCoins[currencyCode] !== 'undefined' && this.props.stakingCoins[currencyCode] * 1 > 0

        return (
            <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }} >
                <AccountGradientBlock>
                    <View style={{ flexDirection: 'row' }} >
                        <TouchableDebounce
                            style={styles.linkButton}
                            onPress={() => this.handleOpenLink(shownAddress, forceLink)}
                            hitSlop={HIT_SLOP}
                        >
                            <View style={{ width: 50, height: 50 }}>
                                <GradientView
                                    style={styles.topContent__icon}
                                    array={colors.accountScreen.containerBGIcon}
                                    start={styles.containerBG.start}
                                    end={styles.containerBG.end}
                                />
                                <View style={styles.icon}>
                                    <CurrencyIcon
                                        currencyCode={currencyCode}
                                        containerStyle={{ borderWidth: 0 }}
                                        markStyle={{ top: 30 }}
                                        textContainerStyle={{ bottom: -19 }}
                                        textStyle={{ backgroundColor: 'transparent' }}
                                    />
                                </View>
                                <View style={styles.topContent__bottom__btn__shadow}>
                                    <View style={styles.topContent__bottom__btn__shadow__item} />
                                </View>
                            </View>
                        </TouchableDebounce>
                        <View style={{ marginTop: 6 }}>
                            <View style={styles.stakingValue}>
                                <Text style={{ ...styles.currencyName, color: colors.common.text1 }}>{currencySymbol}</Text>
                                {availableStaking &&
                                    <TouchableDebounce
                                        hitSlop={{ top: 15, right: 15, bottom: 7, left: 10 }}
                                        onPress={() => this.accountStaking(currencyCode)}
                                    >
                                        <PercentView
                                            value={this.props.stakingCoins[currencyCode]}
                                            staking
                                        />
                                    </TouchableDebounce>
                                }
                            </View>
                            <TouchableDebounce
                                style={styles.topContent__middle}
                                onPress={this.handleBackDropModal}
                                hitSlop={{ top: 6, right: 15, bottom: 15, left: 15 }}
                                onLongPress={() => this.handleBtcAddressCopy(shownAddress)}
                                delayLongPress={500}
                            >
                                <View style={{ alignItems: 'center' }}>
                                    <LetterSpacing text={addressPrep} textStyle={styles.topContent__address} letterSpacing={1} />
                                </View>
                                <View onPress={this.handleBackDropModal} style={styles.copyBtn}>
                                    <IconMaterial name="content-copy" size={15} color={'#939393'} />
                                </View>
                            </TouchableDebounce>
                        </View>
                        {currencyCode !== 'TRX' &&
                            <View style={{ ...styles.settings, right: 0, position: 'absolute' }}>
                                {this.settings(currencyCode)}
                            </View>}
                    </View>
                    {this.renderBalance()}
                    {this.renderStakeBalance(availableStaking)}
                </AccountGradientBlock>
                <Portal>
                    <SheetBottom
                        ref={ref => this.bottomSheetRef = ref}
                        snapPoints={[0, 300]}
                        index={0}
                    >
                        {this.renderModalContent({ address: shownAddress, forceLink, currencyCode, currencyName })}
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
                <PortalHost name='accountScreenPortal' />
            </View>
        )
    }
}

HeaderBlocks.contextType = ThemeContext

export default HeaderBlocks

const styles = {
    linkButton: {
        position: 'relative',
        paddingRight: 20,
        paddingBottom: 20,
        paddingTop: 0,
        alignItems: 'center',
    },
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    topContent__top: {
        position: 'relative',
        alignItems: 'center',
    },
    currencyName: {
        flexDirection: 'row',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
    },
    topBlock__top_bg: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: 140,
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 16,
    },
    topContent__subtitle: {
        marginTop: -10,
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        textAlign: 'center'
    },
    topContent__title_first: {
        height: 42,
        fontSize: 52,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 50
    },
    topContent__title_last: {
        height: 42,
        fontSize: 32,
        fontFamily: 'Montserrat-Medium',
        lineHeight: 50,
        opacity: 1,
    },
    topContent__bottom: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Platform.OS === 'ios' ? -20 : -30,
        overflow: 'visible'
    },
    topContent__middle: {
        flexDirection: 'row',
        paddingTop: 4,
    },
    topContent__address: {
        marginBottom: 3,
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        color: '#999999'
    },
    segwitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 74,
        paddingLeft: 50,
        paddingRight: 50,
        marginTop: -35
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginLeft: 10
    },
    copyBtn__text: {
        marginTop: 6,
        marginRight: 7,
        fontFamily: 'Montserrat-Bold',
        fontSize: 10,
        color: '#864dd9'
    },
    copyBtn__icon: {
        marginTop: 7
    },
    shadow: {
        marginTop: 10,
        marginHorizontal: 5,

        height: '100%',
        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    },
    topContent__content: {
        position: 'relative',
        zIndex: 2,
    },
    topContent__tag: {
        position: 'absolute',
        top: 0,
        right: 0,

        paddingLeft: 30,
        paddingBottom: 30,
        zIndex: 1
    },
    topContent__content__tag: {
        alignItems: 'center',

        width: 70,
        paddingVertical: 5,

        backgroundColor: '#8D51E4',
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    topContent__tag__text: {
        fontFamily: 'Montserrat-Semibold',
        fontSize: 12,
        color: '#f4f4f4'
    },
    topContent__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 216,
        borderRadius: 16,

        zIndex: 0
    },
    topContent__icon: {
        position: 'relative',

        width: 50,
        height: 50,

        borderRadius: 30,

        zIndex: 1
    },
    topContent__bottom__btn: {

        justifyContent: 'center',
        alignItems: 'center',

        width: 50,
        height: 50,

        borderRadius: 50
    },
    topContent__bottom__btn__white: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: 50,
        height: 50,

        backgroundColor: '#fff',
        borderRadius: 50,

        zIndex: 1
    },
    topContent__bottom__btn__wrap: {
        position: 'relative',

        width: 50,
        height: 50,

        borderRadius: 50,

        zIndex: 2
    },
    topContent__bottom__btn__line: {
        width: 16,
        height: 1.5,

        marginTop: 2,

        backgroundColor: '#864DD9'
    },
    topContent__bottom__btn__shadow: {
        position: 'absolute',
        top: 2,
        // left: 3,

        width: 40,
        height: 40,

        zIndex: 0,

        borderRadius: 30
    },
    topContent__bottom__btn__shadow__item: {
        width: 50,
        height: 46,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,

        backgroundColor: '#fff',
        borderRadius: 100,

        zIndex: 0
    },
    topContent__bottom__btn__text: {
        marginTop: 5,

        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular'
    },
    icon: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: 3
    },
    settings: {
        marginRight: 4,
        // marginTop: 10
    },
    availableText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        color: '#999999'
    },
    stakingValue: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    hiddenBalance: {
        marginTop: Platform.OS === 'ios' ? 7 : 9.3,
        paddingHorizontal: 15,
        fontSize: 52,
        lineHeight: 54
    }
}
