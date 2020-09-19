/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, TouchableOpacity } from 'react-native'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'

import NavStore from '../../components/navigation/NavStore'
import Button from '../../components/elements/Button'

import { setSelectedAccount, setSelectedCryptoCurrency } from '../../appstores/Stores/Main/MainStoreActions'

import Log from '../../services/Log/Log'
import { strings } from '../../services/i18n'
import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'


class FinishErrorScreen extends Component {

    init () {
        Log.log('Trade.FinishErrorScreen init')

        const currencies = this.props.currencyStore.cryptoCurrencies

        const param = this.props.navigation.getParam('finishScreenParam')

        Log.log('Trade.FinishErrorScreen init param', param)

        let selectedCryptocurrency = false

        if (currencies && param && typeof param.selectedCryptoCurrency !== 'undefined' && typeof param.selectedCryptoCurrency.currencyCode !== 'undefined') {
            Log.log('Trade.FinishErrorScreen init search ' + param.selectedCryptoCurrency)
            let item
            for (item of currencies) {
                if (param.selectedCryptoCurrency.currencyCode === item.currencyCode) {
                    selectedCryptocurrency = JSON.parse(JSON.stringify(item))
                    Log.log('Trade.FinishErrorScreen init found ' + item.currencyCode)
                    break
                }
            }
        }
        return selectedCryptocurrency
    }


    handleOrderHistory = async () => {
        try {
            Log.log('Trade.FinishErrorScreen handleOrderHistory init')

            const selectedCryptocurrency = this.init()

            if (selectedCryptocurrency) {
                setSelectedCryptoCurrency(selectedCryptocurrency)

                await setSelectedAccount()

                NavStore.reset('AccountScreen', {
                    accountScreenParam: {
                        isOrdersActive: true
                    }
                })
            } else {
                Log.log('Trade.FinishErrorScreen init default')
                NavStore.reset('DashboardStack')
            }
        } catch (e) {
            Log.log('Trade.FinishErrorScreen handleOrderHistory error ' + e.message)
            NavStore.reset('DashboardStack')
        }
    }

    handleClose = () => {
        NavStore.goNext('DashboardStack', null, true)
    }

    render() {
        UpdateOneByOneDaemon.pause()
        return (
            <View style={styles.wrapper}>
                <TouchableOpacity style={styles.close} onPress={this.handleClose}>
                    <AntDesignIcon style={styles.close__icon} name='close'/>
                </TouchableOpacity>
                <View style={styles.wrapper__content}>
                    <Feather style={styles.wrapper__icon} name='info'/>
                    <Text style={styles.wrapper__title}>
                        {strings('finishTradeErrorScreen.title')}
                    </Text>
                    <Text style={styles.wrapper__description}>
                        {strings('finishTradeErrorScreen.description')}
                    </Text>
                </View>
                <Button styleText={{ color: '#7127AC' }} backgroundColorArray={['#fff', '#fff']}
                        press={this.handleOrderHistory}>
                    {strings('finishTradeScreen.orderHistoryBtn')}
                </Button>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        currencyStore: state.currencyStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FinishErrorScreen)

const styles = {
    wrapper: {
        flex: 1,
        padding: 30,
        backgroundColor: '#7127AC'
    },
    wrapper__content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    wrapper__title: {
        textAlign: 'center',

        marginBottom: 16,

        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 34,
        color: '#fff'
    },
    wrapper__description: {
        textAlign: 'center',

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#fff'
    },
    wrapper__icon: {
        marginBottom: 48,

        fontSize: 128,
        color: '#fff'
    },
    close: {
        position: 'absolute',
        top: 28,
        right: 0,
        padding: 20,

        zIndex: 1
    },
    close__icon: {
        fontSize: 24,
        color: '#fff'
    }
}
