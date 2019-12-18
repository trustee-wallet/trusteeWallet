import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, Platform, Dimensions, TouchableOpacity } from 'react-native'

import GradientView from '../../../components/elements/GradientView'

import { strings } from '../../../services/i18n'
import { capitalize } from '../../../services/utils'
import Ionicons from 'react-native-vector-icons/Ionicons'

import fiatRatesActions from '../../../appstores/Actions/FiatRatesActions'

import Theme from '../../../themes/Themes'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
import ToolTips from '../../../components/elements/ToolTips'
let styles


class Orders extends Component {

    constructor(){
        super()
        this.state = {
            exchangeOrders: [],
            amountToView: 10
        }
    }

    componentWillMount() {
        styles = Theme.getStyles().accountScreenStyles.orders
    }

    getExchangeOrdersLength = () => this.state.exchangeOrders.length

    handleShowMore = () => this.setState({ amountToView: this.state.amountToView + 10 })

    setAmountToView = () => { this.setState({ amountToView: 10 }) }

    renderTooltip = (props) => {

        return (
            <View>
                <Text style={styles.transaction_title}>{strings('exchangeInit.ordersHistory')}</Text>
                { !props.exchangeOrders.length ? <Text style={styles.transaction__empty_text}>{strings('exchangeInit.ordersNull')}</Text> : null }
            </View>
        )
    }

    render(){

        const { amountToView } = this.state
        const { settingsStore } = this.props
        const { exchangeOrders } = this.props.exchangeStore
        const { localCurrencySymbol, localCurrencyRate } = this.props.fiatRatesStore

        let tmpExchangeOrders = JSON.parse(JSON.stringify(exchangeOrders))
        tmpExchangeOrders = tmpExchangeOrders.filter(item => item.requestedInAmount.currencyCode === this.props.currency.currencyCode || item.requestedOutAmount.currencyCode === this.props.currency.currencyCode)

        this.state.exchangeOrders = tmpExchangeOrders

        return (
            <View style={styles.transaction}>
                <View>
                    <ToolTips type={'ACCOUNT_SCREEN_ORDERS_TIP'} height={100} MainComponent={() => this.renderTooltip({ exchangeOrders: tmpExchangeOrders })} mainComponentProps={{ exchangeOrders }} />
                </View>
                {
                    tmpExchangeOrders.length ? tmpExchangeOrders.map((item, index) => {

                        let date = new Date(item.createdAt)
                        date = date.toString()
                        date = date.split(' ')

                        return index < amountToView ? (
                            <View style={{ width: '100%', position: 'relative', paddingBottom: Platform.OS === 'ios' ? 5 : 0, overflow: 'visible' }} key={index}>
                                <View style={{ position: 'relative', zIndex: 3 }}>
                                    {
                                        item.exchangeWayType === 'SELL' ?
                                            <View>
                                                <View style={styles.transaction__item}>
                                                    <View>
                                                        <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                            {date[1] + ' ' + date[2]}
                                                        </Text>
                                                        <Text style={styles.transaction__subtext}>
                                                            { item.depositAddress.slice(0, 3) + '...' + item.depositAddress.slice(item.depositAddress.length - 2, item.depositAddress.length) }
                                                        </Text>
                                                    </View>
                                                    <GradientView style={styles.circle}
                                                                  array={circle.array}
                                                                  start={circle.start}
                                                                  end={circle.end}/>
                                                          <View style={{ flex: 1 }}>
                                                              <View style={styles.transaction__item__content}>
                                                                  <Text style={styles. transaction__expand}>
                                                                      { capitalize(strings(`exchange.${item.exchangeWayType.toLowerCase()}`)) }
                                                                  </Text>
                                                                  <Text style={[styles.transaction__expand, styles.textAlign_right]}>
                                                                      - { item.requestedInAmount.amount } {this.props.currency.currencySymbol.toUpperCase()}
                                                                  </Text>
                                                              </View>
                                                              <View style={styles.transaction__item__content}>
                                                                  <Text style={[styles.transaction__subtext, styles.textAlign_right, styles.transaction__subtext_status, { flex: 1, marginRight: 5 }]} numberOfLines={1}>
                                                                      { strings(`exchange.ordersStatus.sell.${item.status}`) }
                                                                  </Text>
                                                                  <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>
                                                                      { localCurrencySymbol } {(fiatRatesActions.convertFromCurrencyTo(item.requestedOutAmount.currencyCode, settingsStore.data.local_currency, item.requestedOutAmount.amount)).toFixed(2)}
                                                                  </Text>
                                                              </View>
                                                          </View>
                                                </View>
                                            </View>
                                            : item.exchangeWayType === 'BUY' ?
                                            <View style={[styles.transaction__item]}>
                                                <View>
                                                    <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                        {date[1] + ' ' + date[2]}
                                                    </Text>
                                                    <Text style={[styles.transaction__subtext]}>
                                                        { item.outDestination.slice(0, 3) + '...' + item.outDestination.slice(item.outDestination.length - 2, item.outDestination.length) }
                                                    </Text>
                                                </View>
                                                <GradientView style={styles.circle}
                                                              array={circle.array_}
                                                              start={circle.start}
                                                              end={circle.end}/>
                                                      <View style={{ flex: 1 }}>
                                                          <View style={styles.transaction__item__content}>
                                                              <Text style={[styles.transaction__income]}>
                                                                  { capitalize(strings(`exchange.${item.exchangeWayType.toLowerCase()}`)) }
                                                              </Text>
                                                              <Text style={[styles.transaction__income, styles.textAlign_right, { flex: 1 }]}>
                                                                  + { item.requestedOutAmount.amount } {this.props.currency.currencySymbol.toUpperCase()}
                                                              </Text>
                                                          </View>
                                                          <View style={styles.transaction__item__content}>
                                                              <Text style={[styles.transaction__subtext, styles.textAlign_right, styles.transaction__subtext_status, { flex: 1, marginRight: 5 }]} numberOfLines={1}>
                                                                  { strings(`exchange.ordersStatus.buy.${item.status}`) }
                                                              </Text>
                                                              <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>
                                                                  { localCurrencySymbol } { (fiatRatesActions.convertFromCurrencyTo(item.requestedInAmount.currencyCode, settingsStore.data.local_currency, item.requestedInAmount.amount)).toFixed(2)}
                                                              </Text>
                                                          </View>
                                                      </View>
                                            </View>
                                            :
                                            <View style={[styles.transaction__item]}>
                                                <View>
                                                    <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                        {date[1] + ' ' + date[2]}
                                                    </Text>
                                                    <Text style={[styles.transaction__subtext]}>
                                                        { item.outDestination.slice(0, 3) + '...' + item.outDestination.slice(item.outDestination.length - 2, item.outDestination.length) }
                                                    </Text>
                                                </View>
                                                <GradientView style={styles.circle}
                                                              array={circle.array_}
                                                              start={circle.start}
                                                              end={circle.end}/>
                                                <View style={{ flex: 1 }}>
                                                    <View style={styles.transaction__item__content}>
                                                        <Text style={[styles.transaction__income]}>
                                                            { capitalize(strings(`exchange.${item.exchangeWayType.toLowerCase()}`)) }
                                                        </Text>
                                                        <Text style={[styles.transaction__income, styles.textAlign_right, { flex: 1 }]}>
                                                             { item.requestedInAmount.currencyCode === this.props.currency.currencyCode ? item.requestedInAmount.amount : item.requestedOutAmount.amount }
                                                             { ' ' + this.props.currency.currencySymbol.toUpperCase() }
                                                        </Text>
                                                    </View>
                                                    <View style={styles.transaction__item__content}>
                                                        <Text style={[styles.transaction__subtext, styles.textAlign_right, styles.transaction__subtext_status, { flex: 1, marginRight: 5 }]} numberOfLines={1}>
                                                            { strings(`exchange.ordersStatus.exchange.${item.status}`) }
                                                        </Text>
                                                        <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>
                                                            { item.requestedOutAmount.currencyCode === this.props.currency.currencyCode ? item.requestedInAmount.amount : item.requestedOutAmount.amount }
                                                            { ' ' + BlocksoftDict.getCurrencyAllSettings(item.requestedOutAmount.currencyCode === this.props.currency.currencyCode ? item.requestedInAmount.currencyCode : item.requestedOutAmount.currencyCode).currencySymbol }
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                    }
                                </View>
                                { tmpExchangeOrders.length != index + 1 && amountToView != index + 1 ? <GradientView key={index} style={styles.line} array={line.array} start={line.start} end={line.end}/> : null }
                            </View>
                        ) : null
                    }) : null
                }
                {
                    this.state.amountToView < this.state.exchangeOrders.length ?
                        <TouchableOpacity style={styles.showMore} onPress={this.handleShowMore}>
                            <Text style={styles.showMore__btn}>
                                { strings('account.showMore') }
                            </Text>
                            <Ionicons name='ios-arrow-down' size={12} color='#7127ac' />
                        </TouchableOpacity> : null
                }
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        exchangeStore: state.exchangeStore,
        fiatRatesStore: state.fiatRatesStore
    }
}

export default connect(mapStateToProps, {}, null, { forwardRef: true })(Orders)

const circle = {
    array: ['#752cb2', '#efa7b5'],
    array_: ['#7127ac', '#9b62f0'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const line = {
    array: ['#752cb2', '#efa7b5'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}