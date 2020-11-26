/**
 * @version 0.9
 */
import store from '../../../store'

import AsyncStorage from '@react-native-community/async-storage'

import Api from '../../../services/Api/Api'
import Log from '../../../services/Log/Log'
import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'

const { dispatch } = store


export function setExchangeData(data) {
    dispatch({
        type: 'SET_EXCHANGE_DATA',
        data: data
    })
}

export default new class ExchangeActions {

    init = async () => {
        try {
            const res = await Api.getExchangeData()

            const rubKostilKZT = (await BlocksoftExternalSettings.get('rubKostilKZT')) === 1
            if (res && typeof res.data !== 'undefined' && typeof res.data.exchangeWays !== 'undefined') {
                const tradeApiConfig = []
                let item
                for (item of res.data.exchangeWays.sell) {
                    if (rubKostilKZT && item.outCurrencyCode === 'RUB' && item.outPaywayCode === 'VISA_MC_P2P' && item.supportedCountries[0] === '643' && item.supportedCountries.length === 1) { // Russia
                        item.hasDouble = true
                        tradeApiConfig.push(item)
                        tradeApiConfig.push({
                            ...item,
                            supportedCountries: ['398'],
                            id: 'ksu_' + item.id,
                            supportedByCurrency: true,
                            paymentTitleSuffix: 'KZ'
                        })
                    } else {
                        tradeApiConfig.push(item)
                    }

                }
                for (item of res.data.exchangeWays.buy) {
                    if (rubKostilKZT && item.inCurrencyCode === 'RUB' && item.inPaywayCode === 'VISA_MC_P2P' && item.supportedCountries[0] === '643' && item.supportedCountries.length === 1) { // Russia
                        item.hasDouble = true
                        tradeApiConfig.push(item)
                        tradeApiConfig.push({
                            ...item,
                            supportedCountries: ['398'],
                            id: 'ksu_' + item.id,
                            supportedByCurrency: true,
                            paymentTitleSuffix: 'KZ'
                        })
                    } else {
                        tradeApiConfig.push(item)
                    }
                }
                const exchangeApiConfig = res.data.exchangeWays.exchange

                dispatch({
                    type: 'SET_TRADE_API_CONFIG',
                    tradeApiConfig: { exchangeWays: tradeApiConfig }
                })
                dispatch({
                    type: 'SET_EXCHANGE_API_CONFIG',
                    exchangeApiConfig
                })
                dispatch( {
                    type: 'SET_TRADE_PREV',
                    tradePrevCC: await AsyncStorage.getItem('trade.selectedCryptocurrency.currencyCode'),
                    tradePrevFC: await AsyncStorage.getItem('trade.selectedFiatCurrency.cc'),
                    tradePrevID: await AsyncStorage.getItem('trade.selectedPaymentSystem.id'),
                    tradePrevCardID: await AsyncStorage.getItem('trade.selectedCard.index'),
                    exchangeInCC: await AsyncStorage.getItem('exchange.selectedInCurrency.currencyCode'),
                    exchangeOutCC: await AsyncStorage.getItem('exchange.selectedOutCurrency.currencyCode'),
                    advEmail :  await AsyncStorage.getItem('trade.advEmail'),
                    advWallet :  await AsyncStorage.getItem('trade.advWallet'),
                    perfectWallet :  await AsyncStorage.getItem('trade.perfectWallet'),
                    payeerWallet :  await AsyncStorage.getItem('trade.payeerWallet'),
                })
            }
        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('ACT/Exchange InitialScreen error 1 ' + e.message)
            } else {
                Log.err('ACT/Exchange InitialScreen error 11 ' + e.message)
            }
        }
    }

    handleSetTradeType = tradeTypeObj => {
        dispatch({
            type: 'SET_TRADE_TYPE',
            tradeType: tradeTypeObj.tradeType
        })
    }

    setExchangeOrderList = exchangeOrderList => {
        dispatch({
            type: 'SET_EXCHANGE_ORDERS_DATA',
            exchangeOrders: exchangeOrderList
        })
    }

    handleSetNewInterface = (newInterface, type) => {
        if (type === 'SELL') {
            dispatch({
                type: 'SET_NEWINERFACE_SELL',
                isNewInterfaceSell: newInterface
            })
        } else if (type === 'BUY') {
            dispatch({
                type: 'SET_NEWINERFACE_BUY',
                isNewInterfaceBuy: newInterface
            })
        }
    }
}

