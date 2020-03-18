import React, { Component } from "react"
import { connect } from "react-redux"
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity
} from "react-native"

import firebase from "react-native-firebase"

import Navigation from "../../components/navigation/Navigation"
import LightButton from "../../components/elements/LightButton"
import LetterSpacing from "../../components/elements/LetterSpacing"
import NavStore from "../../components/navigation/NavStore"
import CustomIcon from "../../components/elements/CustomIcon"

import Wallet from "./elements/Wallet"

import { setFlowType } from "../../appstores/Actions/CreateWalletActions"

import utils from "../../services/utils"
import { strings } from "../../services/i18n"


class WalletListScreen extends Component {

    constructor(props){
        super(props)
        this.state = {
            totalBalance: 0
        }
    }

    setTotalBalance = (balance) => this.setState((state) => { return { totalBalance: state.totalBalance + (+balance) }})

    handleImport = () => {
        setFlowType({
            flowType: "IMPORT_WALLET"
        })
        NavStore.goNext("EnterNameScreen")
    }

    render() {
        firebase.analytics().setCurrentScreen("Settings.WalletListScreen")

        const { totalBalance } = this.state
        const { fiatRatesStore } = this.props
        const { selectedWallet, wallets } = this.props.mainStore

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={ strings("settings.walletList.title") }
                />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.wrapper__scrollView}>
                    <View style={styles.wrapper__top}>
                        <View style={styles.wrapper__top__content}>
                            <LetterSpacing text={strings("settings.walletList.totalBalance")} textStyle={styles.wrapper__top__content__title} letterSpacing={0.5} />
                            <Text style={styles.wrapper__top__content__text}>
                                { fiatRatesStore.localCurrencySymbol } { utils.prettierNumber(totalBalance, 2) }
                            </Text>
                        </View>
                        <TouchableOpacity onPress={this.handleImport}>
                            <LightButton Icon={(props) => <CustomIcon size={10} name={"receive"} {...props} /> } iconStyle={{ marginHorizontal: 3 }} title={strings("walletCreateScreen.importWallet").split(" ")[0]} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.wrapper__content}>
                        <View style={styles.block}>
                                {
                                    wallets.map((item, index) => {
                                        return (
                                            <Wallet selectedWallet={selectedWallet}
                                                    wallet={item}
                                                    key={index}
                                                    setTotalBalance={this.setTotalBalance} />
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
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletListScreen)

const styles = {
    wrapper: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        paddingLeft: 15,
        paddingRight: 15,
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        paddingHorizontal: 31,
        marginTop: 16
    },
    wrapper__top__content: {

    },
    wrapper__top__content__title: {
        marginBottom: 6,

        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        color: "#999"
    },
    wrapper__top__content__text: {
        fontSize: 18,
        fontFamily: 'Montserrat-Bold',
        color: "#404040"
    },
}
