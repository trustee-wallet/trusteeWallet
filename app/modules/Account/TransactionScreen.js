import React, { Component } from 'react'
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
    Linking,
    TextInput, Dimensions, PixelRatio
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '../../services/i18n'
import Header from '../../components/elements/new/Header'
import NavStore from '../../components/navigation/NavStore'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'


class TransactionScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
        }
    }

    closeAction = () => {
        NavStore.goBack()
    }

    getTransactionData(data) {
        let datetime = new Date(data)
        datetime = (datetime.getDate().toString().length === 1 ? '0' + datetime.getDate() : datetime.getDate()) + '/' +
            ((datetime.getMonth() + 1).toString().length === 1 ? '0' + (datetime.getMonth() + 1) : (datetime.getMonth() + 1)) + '/' + datetime.getFullYear()
        return datetime
    }

    headerTrx = (trx) => {

        const status = trx.transactionStatus

        let arrowIcon = <Feather name={'arrow-up-right'} style={{ marginTop: 1, color: '#404040', fontSize: 15 }} />

        if (trx.transactionDirection === 'income' || trx.transactionDirection === 'claim') {
            arrowIcon = <Feather name={'arrow-down-left'} style={{ marginTop: 1, color: '#404040', fontSize: 15 }} />
        }
        if (trx.transactionDirection === 'self') {
            arrowIcon = <FontAwesome5 name="infinity" style={{ marginTop: 1, color: '#404040', fontSize: 10 }} />
        }
        if (status === 'fail' || status === 'missing' || status === 'replaced') {
            arrowIcon = <Feather name="x" style={{ marginTop: 1, color: '#404040', fontSize: 15 }} />
        }

        return (
            <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text>{trx.transactionDirection}</Text>
                    <View>{arrowIcon}</View>
                </View>
                <View>
                    <Text>{new Date(trx.createdAt).toTimeString().slice(0, 8)} {this.getTransactionData(trx.createdAt)}</Text>
                </View>
                <View>
                    <Text>{trx.status || status}</Text>
                </View>
                <View>
                    <Text>
                        {this.prepareValueToView(trx.addressAmountPretty, '', trx.transactionDirection)}
                    </Text>
                </View>

            </View>
        )
    }

    prepareValueToView = (value, currencySymbol, direction) => `${(direction === 'outcome' || direction === 'self' || direction === 'freeze') ? '-' : '+'} ${value}`

    render() {

        const { colors, isLight } = this.context

        const transaction = this.props.navigation.getParam('transaction')

        // const dict = new UIDict(cryptoCurrency.currencyCode)
        // const color = dict.settings.colors.mainColor
        const subtitle = typeof transaction.subtitle !== 'undefined' && transaction.subtitle ? transaction.subtitle : false

        const doteSlice = subtitle ? subtitle.indexOf('-') : -1
        const subtitleMini = doteSlice && transaction.exchangeWayType === 'EXCHANGE' ? transaction.transactionDirection === 'income' ?
            transaction.subtitle.slice(0, doteSlice) : transaction.transactionDirection === 'outcome' ?
                transaction.subtitle.slice(doteSlice + 1, transaction.subtitle.length) : transaction.subtitle : transaction.subtitle

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    rightType="close"
                    rightAction={this.closeAction}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={() => this.headerTrx(transaction)}
                    anime={false}
                />
                <View style={{ flex: 1, marginTop: 200 }}>
                    <Text>
                        {typeof transaction.addressTo !== 'undefined' ? transaction.addressTo.toString() : ''}
                        {typeof transaction.addressFrom !== 'undefined' ? transaction.addressFrom.toString() : ''}
                    </Text>
                </View>
            </View>
        )
    }
}

TransactionScreen.contextType = ThemeContext

export default TransactionScreen

const styles = {
    container: {
        flex: 1
    },
}