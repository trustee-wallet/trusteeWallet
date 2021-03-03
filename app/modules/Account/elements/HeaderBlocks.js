/**
 * @version 0.30
 */
import React, { Component } from 'react'

import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native'

import GradientView from '../../../components/elements/GradientView'
import ToolTips from '../../../components/elements/ToolTips'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'
import LetterSpacing from '../../../components/elements/LetterSpacing'
import Loader from '../../../components/elements/LoaderItem'
import Copy from 'react-native-vector-icons/MaterialCommunityIcons'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import AsyncStorage from '@react-native-community/async-storage'
import { ThemeContext } from '../../../modules/theme/ThemeProvider'

import Log from '../../../services/Log/Log'
import Toast from '../../../services/UI/Toast/Toast'
import copyToClipboard from '../../../services/UI/CopyToClipboard/CopyToClipboard'
import checkTransferHasError from '../../../services/UI/CheckTransferHasError/CheckTransferHasError'

import BlocksoftPrettyStrings from '../../../../crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import currencyActions from '../../../appstores/Stores/Currency/CurrencyActions'

import { strings } from '../../../services/i18n'

import IconAwesome from 'react-native-vector-icons/FontAwesome'
import NavStore from '../../../components/navigation/NavStore'
import CustomIcon from '../../../components/elements/CustomIcon'
import { HIT_SLOP } from '../../../themes/Themes'

class HeaderBlocks extends Component {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    handleOpenLink = async (address, forceLink = false) => {
        const now = new Date().getTime()
        const diff = now - this.props.cacheAsked * 1
        if (!this.props.cacheAsked || diff > 10000) {
            showModal({
                type: 'YES_NO_MODAL',
                title: strings('account.externalLink.title'),
                icon: 'WARNING',
                description: strings('account.externalLink.description')
            }, () => {
                AsyncStorage.setItem('asked', now + '')
                this.props.cacheAsked = now
                this.actualOpen(address, forceLink)
            })
        } else {
            this.actualOpen(address, forceLink)
        }
    }

    handleOpenLinkLongPress = () => {
        const { account } = this.props

        let text = account.id + ' ' + account.address + ' ' + account.balanceProvider + ' current ' + account.balance + ', scan log ' + account.balanceScanLog
        if (typeof account.legacyData !== 'undefined' && account.legacyData) {
            text += `
        
        
        ` + account.legacyData.id + ' ' + account.legacyData.address + ' ' + account.legacyData.balanceProvider + ' current ' + account.legacyData.balance + ', scan log ' + account.legacyData.balanceScanLog
        }

        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: 'SYSTEM_LOG',
            description: text.slice(0, 500)
        })
    }

    actualOpen = (address, forceLink = false) => {
        let { currencyExplorerLink } = this.props.cryptoCurrency
        if (forceLink) {
            currencyExplorerLink = forceLink
        }
        Linking.canOpenURL(`${currencyExplorerLink}${address}`).then(supported => {
            if (supported) {
                let linkUrl = `${currencyExplorerLink}${address}`
                if (linkUrl.indexOf('?') === -1) {
                    linkUrl += '?from=trustee'
                }
                Linking.openURL(linkUrl)
            } else {
                Log.err('Account.AccountScreen Dont know how to open URI', `${currencyExplorerLink}${address}`)
            }
        })
    }

    handleBtcAddressCopy = (address) => {
        const { cryptoCurrency, account } = this.props
        checkTransferHasError({
            walletHash: account.walletHash,
            currencyCode: cryptoCurrency.currencyCode,
            currencySymbol: cryptoCurrency.currencySymbol,
            addressFrom: address,
            addressTo: address
        })
        copyToClipboard(address)
        Toast.setMessage(strings('toast.copied')).show()
    }

    renderBalance = (cryptoCurrency, account) => {

        const { colors, GRID_SIZE } = this.context

        const { isBalanceVisible, triggerBalanceVisibility, originalVisibility } = this.props

        const isSyncronized = currencyActions.checkIsCurrencySynchronized({ account, cryptoCurrency })

        let tmp = BlocksoftPrettyNumbers.makeCut(account.balancePretty, 7, 'AccountScreen/renderBalance').separated
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

        if (isSyncronized) {
            return (
                <View style={{ ...styles.topContent__top, marginHorizontal: GRID_SIZE }}>
                    <View style={{ ...styles.topContent__title, flexGrow: 1 }}>
                        <TouchableOpacity
                            onPressIn={() => triggerBalanceVisibility(true)}
                            onPressOut={() => triggerBalanceVisibility(false)}
                            activeOpacity={1}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: isBalanceVisible? 60 : 30, bottom: 10, left: isBalanceVisible? 60 : 30 }}
                            >
                            {isBalanceVisible ?
                            <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                                {balancePrettyPrep1}
                                <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                                    {balancePrettyPrep2}
                                </Text>
                            </Text>
                            : 
                                <Text style={{ ...styles.topContent__title_last, color: colors.common.text1, marginTop: 10, paddingHorizontal: 15, fontSize: 52, lineHeight: 60 }}>
                                    ****</Text>
                            }
                        </TouchableOpacity>
                    </View>
                    { isBalanceVisible &&
                    <LetterSpacing text={account.basicCurrencySymbol + ' ' + account.basicCurrencyBalance}
                        textStyle={{ ...styles.topContent__subtitle, color: colors.common.text2 }} letterSpacing={.5} />
                    }
                </View>
            )
        } else {
            return (
                <View style={styles.topContent__top}>
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
            <TouchableOpacity style={{ flex: 1, paddingLeft: 23 }} onPress={() => this.accountSetting(currencyCode)} hitSlop={HIT_SLOP}>
                <View style={{ paddingVertical: 12 }}>
                    <CustomIcon name={'coinSettings'} size={20} color={colors.common.text1} />
                </View>
            </TouchableOpacity>
        )
    }

    accountSetting = (account) => {
        if (account === 'FIO') {
            NavStore.goNext('FioMainSettings')
        } else {
            NavStore.goNext('AccountSettings', { account })
        }
    }

    settings = (currencyCode) => {
        if (currencyCode === 'BTC') {
            return this.handleSettingAccount(currencyCode)
        } else if (currencyCode === 'USDT') {
            return this.handleSettingAccount(currencyCode)
        }  else if (currencyCode === 'ETH') {
            return this.handleSettingAccount(currencyCode)
        } else if (currencyCode === 'FIO') {
            return this.handleSettingAccount(currencyCode)
        } else if (currencyCode === 'XMR') {
            return this.handleSettingAccount(currencyCode)
        } else if (currencyCode === 'TRX') {
            return this.handleSettingAccount(currencyCode)
        } else {
            return null
        }
    }

    render() {

        const { colors } = this.context

        const { mainStore, account, cryptoCurrency, settingsStore } = this.props
        const address = account.address

        let shownAddress = address
        let forceLink = false
        if (cryptoCurrency.currencyCode === 'BTC') {
            let isSegwit = typeof settingsStore.data.btc_legacy_or_segwit !== 'undefined' && settingsStore.data.btc_legacy_or_segwit === 'segwit'
            if (typeof account.walletPubs === 'undefined' || !account.walletPubs) {
                shownAddress = isSegwit ? account.segwitAddress : account.legacyAddress
            } else {
                isSegwit = isSegwit ? 'btc.84' : 'btc.44'
                shownAddress = account.walletPubs[isSegwit].walletPubValue
                forceLink = 'https://blockchair.com/bitcoin/xpub/'
            }
        }


        const addressPrep = BlocksoftPrettyStrings.makeCut(shownAddress, 6, 6)

        return (
            <View style={styles.topContent}>
                <View style={styles.topContent__content}>
                    <View style={{ flexDirection: 'row' }} >
                        <View style={{ marginTop: 16 }}>
                            <TouchableOpacity style={{
                                position: 'relative',
                                padding: 20,
                                paddingTop: 0,
                                alignItems: 'center'
                            }} onPress={() => this.handleOpenLink(shownAddress, forceLink)}
                                onLongPress={() => this.handleOpenLinkLongPress()}
                                delayLongPress={5000}>
                                <View style={{ position: 'relative', width: 50, height: 50 }}>
                                    <GradientView style={styles.topContent__icon} array={colors.accountScreen.containerBGIcon}
                                        start={styles.containerBG.start}
                                        end={styles.containerBG.end} />
                                    <View style={styles.icon}>
                                        <CurrencyIcon currencyCode={cryptoCurrency.currencyCode}
                                            containerStyle={{ borderWidth: 0 }}
                                            markStyle={{ top: 30 }}
                                            textContainerStyle={{ bottom: -19 }}
                                            textStyle={{ backgroundColor: 'transparent' }} />
                                    </View>
                                    <View style={{ ...styles.topContent__bottom__btn__shadow }}>
                                        <View style={styles.topContent__bottom__btn__shadow__item} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 22 }}>
                            <Text style={{...styles.currencyName, color: colors.common.text1 }}>{cryptoCurrency.currencySymbol}</Text>
                            <TouchableOpacity style={styles.topContent__middle}
                                onPress={() => this.handleBtcAddressCopy(shownAddress)}
                                hitSlop={HIT_SLOP}>
                                <View style={{ alignItems: 'center' }}>
                                    <LetterSpacing text={addressPrep} textStyle={styles.topContent__address} letterSpacing={1} />
                                </View>
                                <View onPress={() => this.handleBtcAddressCopy(shownAddress)}
                                    style={styles.copyBtn}>
                                    <Copy name="content-copy" size={15} color={'#939393'} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{ ...styles.settings, right: 0, position: 'absolute' }}>
                            {this.settings(account.currencyCode)}
                        </View>
                    </View>
                    {this.renderBalance(cryptoCurrency, mainStore.selectedAccount)}
                </View>
                <GradientView style={styles.bg}
                    array={colors.accountScreen.containerBG} start={styles.containerBG.start}
                    end={styles.containerBG.end} />
                <View style={styles.topContent__bg}>
                    <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
                </View>
            </View>
        )
    }
}

HeaderBlocks.contextType = ThemeContext

export default HeaderBlocks

const styles = {
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    bg: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: 216,

        zIndex: 1,

        borderRadius: 16,
    },

    topContent: {
        position: 'relative',

        height: 244,

        marginTop: 25,
        marginLeft: 16,
        marginRight: 16,
        borderRadius: 16
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
        height: 206,
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
        marginRight: 20,
        marginTop: 10
    }
}
