/**
 * @version 0.43
 * @author Vadym
 */

import React, { PureComponent } from 'react'
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Platform
} from 'react-native'
import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import GradientView from '@app/components/elements/GradientView'
import NavStore from '@app/components/navigation/NavStore'

import { ThemeContext } from '@app/theme/ThemeProvider'
import Tabs from '@app/components/elements/new/TabsWithUnderlineOld'
import { TabView } from 'react-native-tab-view'
import Account from '@app/appstores/DataSource/Account/AccountHd'

import { getSelectedAccountData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import { strings } from '@app/services/i18n'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { changeAddress, getAddress } from './helpers'

import LetterSpacing from '@app/components/elements/LetterSpacing'
import Loader from '@app/components/elements/LoaderItem'

class AllAddressesScreen extends PureComponent {

    state = {
        isBalanceVisibleTriggered: false,
        isBalanceVisible: true,
        routes: [
            {
                title: 'SEGWIT',
                key: 'first'
            },
            {
                title: 'LEGACY',
                key: 'second'
            }
        ],
        index: 0
    }

    handleClose = () => {
        NavStore.reset()
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleGetAddress = () => {
        getAddress.call(this)
    }

    handleChangeAddress = async () => {
        await changeAddress.call(this)
    }

    loadAddresses = async () => {

        const { currencyCode, derivationPath, walletPubs } = this.props.selectedAccountData
        const { walletIsHd } = this.props.selectedWalletData

        // console.log(`walletHash`, walletHash)
        // console.log(`currencyCode`, currencyCode)
        // console.log(`walletIsHd`, walletIsHd)
        // console.log(`derivationPath`, derivationPath)
        // console.log(`walletPubs`, walletPubs)

        const params = {
            notAlreadyShown: walletIsHd,
           
            currencyCode: currencyCode,
            
            derivationPath: derivationPath,
            walletPubId: walletPubs.id
        }

        const tmp = await Account.getAccountForChange(params)
    }

    triggerBalanceVisibility = (value, originalVisibility) => {
        this.setState((state) => ({ isBalanceVisible: value || originalVisibility, isBalanceVisibleTriggered: true }))
    }

    renderHeader = () => {

        const { originalVisibility } = this.props
        const { isBalanceVisible, isBalanceVisibleTriggered } = this.state
        const finalIsBalanceVisible = isBalanceVisibleTriggered ? isBalanceVisible : originalVisibility

        const { isSynchronized, balancePretty, basicCurrencySymbol, basicCurrencyBalance } = this.props.selectedAccountData

        const { colors, GRID_SIZE } = this.context

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

        return(
            <View>
                <View style={[styles.headerContainer, { marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }]}>
                    <Text style={[styles.headerTitle, { color: colors.common.text1 }]}>Balance</Text>
                    <BorderedButton
                        text={strings('settings.walletList.generateNew')}
                        onPress={this.handleChangeAddress}
                    />
                </View>
                {isSynchronized ?
                    <View style={{ ...styles.topContent__top, marginHorizontal: GRID_SIZE }}>
                        <View style={{ ...styles.topContent__title, flexGrow: 1 }}>
                            <TouchableOpacity
                                onPressIn={() => this.triggerBalanceVisibility(true, originalVisibility)}
                                onPressOut={() => this.triggerBalanceVisibility(false, originalVisibility)}
                                activeOpacity={1}
                                disabled={originalVisibility}
                                hitSlop={{ top: 10, right: finalIsBalanceVisible ? 60 : 30, bottom: 10, left: finalIsBalanceVisible ? 60 : 30 }}
                            >
                                {finalIsBalanceVisible ? (
                                    <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                                        {balancePrettyPrep1}
                                        <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                                            {balancePrettyPrep2}
                                        </Text>
                                    </Text>
                                ) : (
                                    <Text style={{ ...styles.topContent__title_last, color: colors.common.text1, marginTop: 10, paddingHorizontal: 15, fontSize: 52, lineHeight: 60 }}>
                                        ****
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {finalIsBalanceVisible && (
                            <LetterSpacing
                                text={basicCurrencySymbol + ' ' + basicCurrencyBalance}
                                textStyle={{ ...styles.topContent__subtitle, color: colors.common.text2 }}
                                letterSpacing={.5}
                            />
                        )}
                    </View> :
                    <View style={styles.topContent__top}>
                        <View style={styles.topContent__title}>
                            <View style={{ height: Platform.OS === 'ios' ? 46 : 51, alignItems: 'center' }}>
                                <Loader size={30} color={colors.accountScreen.loaderColor} />
                            </View>
                        </View>
                    </View>
                }
            </View>
        )
    }

    renderAddressBlock = () => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        return(
            <View style={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE / 2, height: 66 }}>
                <View style={styles.shadow__container}>
                    <View style={styles.shadow__item} />
                </View>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.cryptoList__item}
                    onPress={this.loadAddresses}
                >
                    <GradientView
                        style={[styles.cryptoList__item__content, { paddingLeft: GRID_SIZE }]}
                        array={colors.homeScreen.listItemGradient}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.container}>
                            <View style={styles.cryptoList__info}>
                                <Text style={[styles.addressName]}>
                                    Address name
                                </Text> 
                                <Text style={[styles.address, { color: colors.common.text3 }]}>
                                    bc1q8n...mc5gfv
                                </Text>
                            </View>
                            <View style={styles.cryptoList__info}>
                                <Text style={[styles.mainAmount, { color: colors.common.text3 }]}>
                                    23.412 BTC
                                </Text> 
                                <Text style={styles.secondaryAmount}>
                                    $ 100500.54
                                </Text>
                            </View>
                        </View>
                    </GradientView>
                </TouchableOpacity>
            </View>
        )
    }

    renderTabs = () => {
        return(
            <Tabs active={this.state.index} tabs={this.state.routes} changeTab={this.handleTabChange} />
        )
    }

    handleTabChange = (index) => {
        this.setState({
            index
        })
    }

    renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return this.renderFirstRoute()
            case 'second':
                return this.renderSecondRoute()
            default:
                return null
        }
    }

    renderFirstRoute = () => {
        return(
            <View>
                {this.renderAddressBlock()}
                {this.renderAddressBlock()}
                {this.renderAddressBlock()}
                {this.renderAddressBlock()}
            </View>
        )
    }

    renderSecondRoute = () => {
        return(
            <View>
                {this.renderAddressBlock()}
                {this.renderAddressBlock()}
            </View>
        )
    }

    render() {

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                title="All addresses"
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
            >
                
                <View style={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE }}>
                    {this.renderHeader()}
                </View>
                <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE / 2 }}>
                    {this.renderTabs()}
                </View>
                <TabView
                    style={{ flexGrow: 1 }}
                    navigationState={this.state}
                    renderScene={this.renderScene}
                    renderHeader={null}
                    onIndexChange={this.handleTabChange}
                    renderTabBar={() => null}
                    useNativeDriver
                />
            </ScreenWrapper>
        )
    }
}

AllAddressesScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedAccountData: getSelectedAccountData(state),
        selectedWalletData: getSelectedWalletData(state),
        originalVisibility: getIsBalanceVisible(state.settingsStore)
    }
}

export default connect(mapStateToProps)(AllAddressesScreen)

const styles = StyleSheet.create({
    shadow__container: {
        position: 'absolute',
        paddingTop: 1,
        paddingBottom: 6,
        paddingRight: 3,
        paddingLeft: 3,
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        borderWidth: 1,
        borderColor: 'transparent',
        height: 66
    },
    shadow__item: {
        flex: 1,
        borderRadius: 16,
        elevation: 10,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.1,
        shadowRadius: 6.27,
    },
    cryptoList__item: {
        borderRadius: 16,
        height: 66
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        padding: 16,
        height: 66,

        borderRadius: 16,
        zIndex: 10,
    },
    cryptoList__info: {
        justifyContent: 'space-evenly',
        height: 54
    },
    addressName: {
        fontFamily: 'SFUIDisplay',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    address: {
        fontSize: 14,
        lineHeight: 18,
        fontFamily: 'SFUIDisplay',
        letterSpacing: 1
    },
    mainAmount: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'right'
    },
    secondaryAmount: {
        fontFamily: 'SFUIDisplay',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999',
        textAlign: 'right'
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    headerTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        lineHeight: 22
    },
    headerContainer :{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
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
        fontSize: 32,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 50
    },
    topContent__title_last: {
        height: 42,
        fontSize: 16,
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

})
