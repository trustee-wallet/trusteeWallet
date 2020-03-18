import React, { Component } from "react"
import { connect } from "react-redux"
import {
    View,
    Text,
    TouchableOpacity
} from "react-native"

import GradientView from "../../../components/elements/GradientView"
import CustomIcon from "../../../components/elements/CustomIcon"
import NavStore from "../../../components/navigation/NavStore"

import Settings from "./Settings"

import currencyDS from '../../../appstores/DataSource/Currency/Currency'
import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'
import cryptoWalletActions from '../../../appstores/Actions/CryptoWalletActions'
import { showModal } from '../../../appstores/Actions/ModalActions'
import { setFlowType } from '../../../appstores/Actions/CreateWalletActions'

import { strings } from '../../../services/i18n'

import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'


class Wallet extends Component {

    constructor(props){
        super(props)
        this.state = {
            isShowSettings: false,
            walletBalance: 0
        }
    }

    async componentDidMount() {

        const { wallet, mainStore, fiatRatesStore } = this.props
        const mainStoreCryptocurrencies = JSON.parse(JSON.stringify(mainStore.currencies))

        let walletBalance = 0

        let { array: cryptocurrencies } = await currencyDS.getCurrencyBalanceAmount(wallet.wallet_hash)

        cryptocurrencies = cryptocurrencies.map(item => {
            return {
                ...item,
                currencyBalanceAmount: BlocksoftPrettyNumbers.setCurrencyCode(item.currency_code).makePrettie(item.currencyBalanceAmount)
            }
        })

        for(const currency of cryptocurrencies){
            const rate = mainStoreCryptocurrencies.find(item => item.currencyCode === currency.currency_code)
            walletBalance += (+currency.currencyBalanceAmount) * rate.currency_rate_usd
        }

        walletBalance = FiatRatesActions.toLocalCurrency(walletBalance)

        this.props.setTotalBalance(walletBalance)

        walletBalance = fiatRatesStore.localCurrencySymbol + " " + walletBalance

        this.setState({
            walletBalance
        })
    }

    handleBackUpModal = () => {

        const { wallet_name: walletName } = this.props.wallet

        showModal({
            type: "YES_NO_MODAL",
            title: strings("settings.walletList.backupModal.title"),
            icon: "WARNING",
            description: strings("settings.walletList.backupModal.description", { walletName })
        }, () => {
            this.handleBackup()
        })
    }

    handleBackup = () => {
        setFlowType({
            flowType: "BACKUP_WALLET"
        })
        NavStore.goNext("BackupStep0Screen")
    }

    handleSelectWallet = () => {
        const { wallet } = this.props

        cryptoWalletActions.setSelectedWallet(wallet.wallet_hash)
    }

    toggleShowSettings = () => this.setState({ isShowSettings: !this.state.isShowSettings })

    render() {

        const { isShowSettings, walletBalance } = this.state
        const { selectedWallet, wallet } = this.props

        const isSelected = wallet.wallet_hash === selectedWallet.wallet_hash
        const isBackUpped = wallet.wallet_is_backed_up

        return (
            <TouchableOpacity disabled={isSelected} style={styles.wrapper} onPress={this.handleSelectWallet}>
                <GradientView style={styles.wrapper__item} array={styles.wrapper__bg.array} start={styles.wrapper__bg.start} end={styles.wrapper__bg.end}>
                    { isShowSettings ? <Settings wallet={wallet} toggleShowSettings={this.toggleShowSettings} /> : null }
                    <View style={[styles.wrapper__select, isSelected ? styles.wrapper__select_active : null ]} />
                    <TouchableOpacity disabled={!isSelected} style={styles.wrapper__settings} onPress={this.toggleShowSettings}>{ ["1","2","3"].map((item, index) => <View key={index} style={[styles.wrapper__settings__dot, !isSelected ? styles.wrapper__settings__dot__disabled : null ]} /> ) }</TouchableOpacity>
                    <View style={styles.wrapper__content}>
                        <View style={[styles.wrapper__column, { flex: 2 }]}>
                            <View>
                                <Text style={styles.wrapper__title}>{ wallet.wallet_name }</Text>
                                <Text style={styles.wrapper__subTitle}>{ strings("settings.walletList.balance") }</Text>
                                <Text style={styles.wrapper__text}>{ walletBalance }</Text>
                            </View>
                        </View>
                        <View style={styles.wrapper__line}>
                            <View style={styles.wrapper__line__item} />
                        </View>
                        <View style={[styles.wrapper__column, { flex: 1 }]}>
                            <View>
                                { !isBackUpped ?
                                    <TouchableOpacity disabled={!isSelected} style={styles.wrapper__warning} onPress={this.handleBackUpModal}>
                                        <CustomIcon name="warning" style={[styles.wrapper__backUpped__icon, !isSelected ? styles.wrapper__backUpped__icon_disabled : null ]} />
                                    </TouchableOpacity>  : null
                                }
                                <Text style={styles.wrapper__title} />
                                <Text style={styles.wrapper__subTitle}>HD</Text>
                                <Text style={styles.wrapper__text}>{ strings(`settings.walletList.${wallet.wallet_is_hd ? "on" : "off"}`) }</Text>
                            </View>
                        </View>
                    </View>
                </GradientView>
                <View style={styles.shadow}>
                    <View style={styles.shadow__item} />
                </View>
            </TouchableOpacity>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Wallet)

const styles = {
    wrapper: {
        flex: 1,

        marginBottom: 16
    },
    wrapper__item: {
        position: "relative",

        borderRadius: 16,

        zIndex: 2
    },
    wrapper__settings: {
        justifyContent: "space-between",

        position: "absolute",
        top: 0,
        right: 0,

        height: 54,
        padding: 16,

        zIndex: 3
    },
    wrapper__settings__dot: {
        width: 4,
        height: 4,

        backgroundColor: "#864DD9",

        borderRadius: 10
    },
    wrapper__settings__dot__disabled: {
        backgroundColor: "#E3E6E9"
    },
    wrapper__content: {
        position: "relative",

        flexDirection: "row",
        alignItems: "center",

        height: 102,
        paddingLeft: 16,

        borderRadius: 16,

        zIndex: 2
    },
    wrapper__column: {

    },
    wrapper__title: {
        height: 18,
        marginBottom: 18,

        fontFamily: "Montserrat-Bold",
        fontSize: 14,
        color: "#404040"
    },
    wrapper__subTitle: {
        marginBottom: 4,

        fontFamily: "SFUIDisplay-Regular",
        fontSize: 14,
        color: "#999"
    },
    wrapper__text: {
        fontFamily: "Montserrat-Semibold",
        fontSize: 14,
        color: "#404040"
    },
    wrapper__bg: {
        array: ['#fff', '#f2f2f2'],
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    wrapper__line: {
        position: "absolute",
        top: 40,
        left: 20,

        height: 1,
        width: "100%",
    },
    wrapper__line__item: {
        height: "100%",
        marginRight: 98,

        backgroundColor: "#E3E6E9"
    },
    wrapper__backUpped__icon: {
        fontSize: 18,
        color: "#FF2E2E"
    },
    wrapper__backUpped__icon_disabled: {
        color: "#E3E6E9"
    },
    wrapper__warning: {
        position: "absolute",
        top: -18,
        left: -20,

        padding: 20,
        zIndex: 3
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        zIndex: 1
    },
    shadow__item: {
        flex: 1,

        marginHorizontal: 4,
        marginTop: 11,

        backgroundColor: "#fff",

        borderRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10,
    },
    wrapper__select: {
        position: "absolute",
        top: 30,

        width: 4,
        height: 42,

        backgroundColor: "#E3E6E9",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    wrapper__select_active: {
        backgroundColor: "#864DD9",
    },
    settings: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        position: "absolute",
        right: 0,

        width: "50%",
        height: "100%",


        backgroundColor: "#f2f2f2",

        zIndex: 4
    },
    settings__title: {
        marginBottom: 4,

        fontFamily: "SFUIDisplay-Semibold",
        fontSize: 12,
        color: "#404040"
    },
    settings__row: {
        flexDirection: "row",
        alignItems: "center"
    },
    settings__close: {
        padding: 15,
    },
    settings__close__icon: {
        fontSize: 24,
        color: "#864DD9"
    }
}
