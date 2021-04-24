/**
 * @version 0.43
 */
import React from 'react'
import { Text, View, TouchableOpacity } from 'react-native'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import AccountButtons from './AccountButtons'

class AccountData extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            isBalanceVisible: false,
            originalVisibility: false
        }
    }

    componentDidMount(){
        this.setState({
            isBalanceVisible: this.props.isBalanceVisible,
            originalVisibility: this.props.originalVisibility
        })
    }

    triggerBalanceVisibility = (value) => {
        this.setState({
            isBalanceVisible: value || this.state.originalVisibility
        })
    }

    render() {
        const {
            account,
            cryptoCurrency,
            actionReceive,
            actionBuy,
            actionSend
        } = this.props

        const { colors } = this.context

        const { isBalanceVisible, originalVisibility } = this.state

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
        return (
            <>
                <View style={styles.topContent__top}>
                    <View style={styles.topContent__title}>
                    <TouchableOpacity
                            onPressIn={() => this.triggerBalanceVisibility(true)}
                            onPressOut={() => this.triggerBalanceVisibility(false)}
                            activeOpacity={1}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: isBalanceVisible ? 60 : 30, bottom: 10, left: isBalanceVisible ? 60 : 30 }}
                            >
                            {isBalanceVisible ?
                                <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                                    {balancePrettyPrep1}
                                    <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                                        {balancePrettyPrep2 + ' ' + cryptoCurrency.currencySymbol}
                                    </Text>
                                </Text> :
                                <Text style={{ ...styles.topContent__title_last, color: colors.common.text1, fontSize: 38, lineHeight: 40, height: 34 }} >****</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
                <AccountButtons
                    actionBuy={() => actionBuy()}
                    actionSend={() => actionSend()}
                    actionReceive={() => actionReceive()}
                />
            </>
        )
    }
}

AccountData.contextType = ThemeContext

export default AccountData

const styles = {
    topContent__top: {
        position: 'relative',
        alignItems: 'center',
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    topContent__title_first: {
        height: 34,
        fontSize: 30,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 34
    },
    topContent__title_last: {
        height: 32,
        fontSize: 24,
        fontFamily: 'Montserrat-Medium',
        lineHeight: 28,
        opacity: 1,
    },
    topContent__subtitle: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        textAlign: 'center'
    },
}
