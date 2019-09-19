import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, Platform, Dimensions, TouchableOpacity } from 'react-native'

import GradientView from '../../../components/elements/GradientView'

import { strings } from '../../../services/i18n'
import { capitalize } from '../../../services/utils'
import Ionicons from 'react-native-vector-icons/Ionicons'

const { width: SCREEN_WIDTH } = Dimensions.get('window')


class Orders extends Component {

    constructor(){
        super()
        this.state = {
            exchangeOrders: [],
            amountToView: 10
        }
    }

    getExchangeOrdersLength = () => this.state.exchangeOrders.length

    handleShowMore = () => this.setState({ amountToView: this.state.amountToView + 10 })

    setAmountToView = () => { this.setState({ amountToView: 10 }) }

    render(){

        const { amountToView } = this.state
        const { exchangeOrders } = this.props.exchangeStore
        const { localCurrencySymbol, localCurrencyRate } = this.props.fiatRatesStore

        let tmpExchangeOrders = JSON.parse(JSON.stringify(exchangeOrders))
        tmpExchangeOrders = tmpExchangeOrders.filter(item => item.currency === this.props.currency.currencyCode.toLowerCase())

        this.state.exchangeOrders = tmpExchangeOrders

        return (
            <View style={styles.transaction}>
                <Text style={styles.transaction_title}>{strings('exchangeInit.ordersHistory')}</Text>
                {
                    tmpExchangeOrders.length ? tmpExchangeOrders.map((item, index) => {

                        let date = new Date(item.createdAt)
                        date = date.toString()
                        date = date.split(' ')

                        let prettieAmount = item.requestedFiat
                        prettieAmount = +prettieAmount
                        prettieAmount = parseFloat(prettieAmount.toFixed(5))

                        return index < amountToView ? (
                            <View style={{ position: 'relative', paddingBottom: Platform.OS === 'ios' ? 5 : 0, overflow: 'visible' }} key={index}>
                                <View style={{ position: 'relative', zIndex: 3 }}>
                                    {
                                        item.type === 'SELL' ?
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
                                                                      { capitalize(strings(`exchange.${item.type.toLowerCase()}`)) }
                                                                  </Text>
                                                                  <Text style={[styles.transaction__expand, styles.textAlign_right]}>
                                                                      - { item.requestedCrypto } {this.props.currency.currencySymbol.toUpperCase()}
                                                                  </Text>
                                                              </View>
                                                              <View style={styles.transaction__item__content}>
                                                                  <Text style={[styles.transaction__subtext, styles.textAlign_right, styles.transaction__subtext_status, { flex: 1, marginRight: 5 }]} numberOfLines={1}>
                                                                      { strings(`exchange.ordersStatus.sell.${item.status}`) }
                                                                  </Text>
                                                                  <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>
                                                                      { localCurrencySymbol } {(item.requestedFiat / localCurrencyRate).toFixed(2)}
                                                                  </Text>
                                                              </View>
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
                                                        { item.withdrawDestination.slice(0, 3) + '...' + item.withdrawDestination.slice(item.withdrawDestination.length - 2, item.withdrawDestination.length) }
                                                    </Text>
                                                </View>
                                                <GradientView style={styles.circle}
                                                              array={circle.array_}
                                                              start={circle.start}
                                                              end={circle.end}/>
                                                      <View style={{ flex: 1 }}>
                                                          <View style={styles.transaction__item__content}>
                                                              <Text style={[styles.transaction__income]}>
                                                                  { capitalize(strings(`exchange.${item.type.toLowerCase()}`)) }
                                                              </Text>
                                                              <Text style={[styles.transaction__income, styles.textAlign_right, { flex: 1 }]}>
                                                                  + { item.requestedCrypto } {this.props.currency.currencySymbol.toUpperCase()}
                                                              </Text>
                                                          </View>
                                                          <View style={styles.transaction__item__content}>
                                                              <Text style={[styles.transaction__subtext, styles.textAlign_right, styles.transaction__subtext_status, { flex: 1, marginRight: 5 }]} numberOfLines={1}>
                                                                  { strings(`exchange.ordersStatus.buy.${item.status}`) }
                                                              </Text>
                                                              <Text style={{ ...styles.transaction__subtext, ...styles.textAlign_right }}>
                                                                  { localCurrencySymbol } {(item.requestedFiat / localCurrencyRate).toFixed(2)}
                                                              </Text>
                                                          </View>
                                                      </View>
                                            </View>
                                    }
                                </View>
                                { tmpExchangeOrders.length != index + 1 && amountToView != index + 1 ? <GradientView key={index} style={styles.line} array={line.array} start={line.start} end={line.end}/> : null }
                            </View>
                        ) : null
                    }) : <Text style={styles.transaction__empty_text}>{strings('exchangeInit.ordersNull')}</Text>
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

const styles = {
    transaction: {
        flex: 1,
        paddingHorizontal: 15,
    },
    transaction_title: {
        marginLeft: 15,
        marginBottom: 10,
        color: '#404040',
        fontSize: 22,
        fontFamily: 'SFUIDisplay-Regular'
    },
    transaction__empty_text: {
        marginTop: -10,
        marginLeft: 15,
        color: '#404040',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular'
    },
    transaction__item: {
        position: 'relative',
        paddingTop: 10,
        paddingBottom: 10,
        marginLeft: 15,
        marginRight: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    transaction__item__content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    transaction__item_active: {
        backgroundColor: '#fff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    transaction__subtext: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999',
        fontSize: 12
    },
    transaction__content: {
        flex: 1,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        flexDirection: 'row'
    },
    transaction__expand: {
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#e77ca3',
        fontSize: 16
    },
    transaction__income: {
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9',
        fontSize: 16
    },
    transaction__bg: {
        alignItems: 'flex-end',
        position: 'absolute',
        top: 0,
        left: 15,
        width: SCREEN_WIDTH - 30,
        height: '100%',
        borderRadius: 15,
        //backgroundColor: '#fff',
        zIndex: 1
    },
    transaction__bg_active: {
        backgroundColor: '#e77ca3'
    },
    transaction__action: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: '100%'
    },
    transaction__action__text: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#ffffff',
        fontSize: 10
    },
    circle: {
        position: 'relative',
        width: 10,
        height: 10,
        marginLeft: 6,
        marginRight: 20,
        borderRadius: 10,
        zIndex: 2
    },
    line: {
        position: 'absolute',
        top: 30,
        left: 77,
        width: 2,
        height: 60,
        zIndex: 2
    },
    textAlign_right: {
        textAlign: 'right'
    },
    transaction__subtext_status: {
        textAlign: 'left'
    },
    showMore: {
        flexDirection: 'row',
        justifyContent: 'center',

        padding: 10,
        marginBottom: 20
    },
    showMore__btn: {
        marginRight: 5,

        color: '#864dd9',
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Bold'
    }
}
