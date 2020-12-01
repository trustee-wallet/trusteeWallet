/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'

import firebase from 'react-native-firebase'

import Navigation from '../../components/navigation/Navigation'
import LightButton from '../../components/elements/LightButton'
import LetterSpacing from '../../components/elements/LetterSpacing'
import NavStore from '../../components/navigation/NavStore'
import CustomIcon from '../../components/elements/CustomIcon'

import Wallet from './elements/Wallet'

import { setFlowType, setWalletName } from '../../appstores/Stores/CreateWallet/CreateWalletActions'

import { strings } from '../../services/i18n'

import DaemonCache from '../../daemons/DaemonCache'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'

class WalletListScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            totalBalance: 0
        }
        this.walletsRefs = {}
    }


    handleImport = () => {
        setFlowType({
            flowType: 'IMPORT_WALLET'
        })
        setWalletName({ walletName: '' })
        NavStore.goNext('EnterMnemonicPhrase')
    }

    closeAllSettings = () => {
        let i = 0
        for (const item in this.walletsRefs) {
            this.walletsRefs[`walletRef${i}`].closeSetting()
            i++
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('Settings.WalletListScreen')


        const { selectedWallet, selectedBasicCurrency } = this.props.mainStore
        const { wallets } = this.props
        const { accountList } = this.props.accountStore

        let totalBalance = 0
        let localCurrencySymbol = selectedBasicCurrency.symbol

        const CACHE_SUM = DaemonCache.getCache(false)
        if (CACHE_SUM) {
            totalBalance = BlocksoftPrettyNumbers.makeCut(CACHE_SUM.balance, 2, 'Settings/totalBalance').separated
            localCurrencySymbol = CACHE_SUM.basicCurrencySymbol
        }

        const importBtnTitle = strings('walletCreateScreen.importWallet').split(' ')[0]

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('settings.walletList.title')}
                />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.wrapper__scrollView}>
                    <View style={styles.wrapper__top}>
                        <View style={styles.wrapper__top__content}>
                            <LetterSpacing text={strings('settings.walletList.totalBalance')} textStyle={styles.wrapper__top__content__title} letterSpacing={0.5}/>
                            <Text style={styles.wrapper__top__content__text}>
                                {localCurrencySymbol} {totalBalance}
                            </Text>
                        </View>

                                <TouchableOpacity onPress={this.handleImport}>
                                    <LightButton Icon={(props) => <CustomIcon size={10} name={'receive'} {...props} />} iconStyle={{ marginHorizontal: 3 }} title={importBtnTitle}/>
                                </TouchableOpacity>

                    </View>
                    <View style={styles.wrapper__content}>
                        <View style={styles.block}>
                            {
                                wallets.map((item, index) => {
                                    return (
                                        <Wallet ref={ref => this.walletsRefs[`walletRef${index}`] = ref}
                                                selectedWallet={selectedWallet}
                                                accountListByHash={accountList[item.walletHash]}
                                                wallet={item}
                                                key={index}
                                                setTotalBalance={this.setTotalBalance}
                                                closeAllSettings={this.closeAllSettings}/>
                                    )
                                })
                            }
                        </View>
                    </View>
                </ScrollView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        accountStore : state.accountStore,
        wallets: state.walletStore.wallets
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(WalletListScreen)

const styles = {
    wrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    wrapper__scrollView: {
        marginTop: 80
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        marginTop: 35
    },
    title: {
        position: 'absolute',
        top: 75,
        width: '100%',
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#f4f4f4',
        textAlign: 'center'
    },
    wrapper__top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        paddingHorizontal: 31,
        marginTop: 16
    },
    wrapper__top__content: {},
    wrapper__top__content__title: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#999'
    },
    wrapper__top__content__text: {
        fontSize: 18,
        fontFamily: 'Montserrat-Bold',
        color: '#404040'
    }
}
