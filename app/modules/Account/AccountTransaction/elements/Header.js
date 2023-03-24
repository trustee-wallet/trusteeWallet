import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import LetterSpacing from '@app/components/elements/LetterSpacing'

import { capitalize } from '@app/services/UI/Capitalize/Capitalize'
import { strings } from '@app/services/i18n'
import { useTheme } from '@app/theme/ThemeProvider'
import BlocksoftPrettyDates from '@crypto/common/BlocksoftPrettyDates'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'
import CustomIcon from '@app/components/elements/CustomIcon'

import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Log from '@app/services/Log/Log'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'


const prepareStatusHeaderToView = (status) => {
    return strings(`account.transactionScreen.header.status.${status.toLowerCase()}`).toUpperCase()
}

const HeaderTx = (props) => {

    const { transaction, color, cryptoCurrency, notification } = props

    if (Object.keys(transaction).length === 0) {
        return (
            <View></View>
        )
    }

    const { colors, GRID_SIZE } = useTheme()

    const { 
        transactionDirection,
        addressAmountPretty,
        addressAmount,
        addressAmountPrettyPrefix,
        wayType,
        transactionVisibleStatus,
        transactionFeePretty
    } = transaction

    const currencySymbol = typeof cryptoCurrency !== 'undefined' ? cryptoCurrency.currencySymbol : ''

    let status = transactionVisibleStatus

    let arrowIcon = <Feather name='arrow-up-right' style={{ color: colors.common.text1, fontSize: 17 }} />

    if (transactionDirection === 'income' || transactionDirection === 'claim' || transactionDirection === 'swap_income') {
        arrowIcon = <Feather name='arrow-down-left' style={{ color: colors.common.text1, fontSize: 17 }} />
    }
    if (transactionDirection === 'self') {
        arrowIcon = <FontAwesome5 name='infinity' style={{ color: colors.common.text1, fontSize: 17 }} />
    }
    if (wayType === TransactionFilterTypeDict.SWAP) {
        arrowIcon = <CustomIcon name='swap' style={{ color: colors.common.text1, fontSize: 17 }} />
    }
    if (transaction?.transactionFilterType === 'walletConnect') {
        arrowIcon = <CustomIcon name='walletConnect' style={{ color: colors.common.text1, fontSize: 14 }} />
    } else if (wayType === TransactionFilterTypeDict.FEE) {
        arrowIcon = <CustomIcon name='feeTxScreen' style={{ color: colors.common.text1, fontSize: 14 }} />
    }

    // if (transactionStatus === 'fail' || transactionStatus === 'missing' || transactionStatus === 'replaced') {
    //     arrowIcon = <Feather name='x' style={{ color: colors.common.text1, fontSize: 17 }} />
    // }

    const copyToClip = () => {
        try {
            copyToClipboard(addressAmountPretty.toString())
            Toast.setMessage(strings('toast.copied')).show()
        } catch (e) {
            Log.err('Header.copyToClip error', e.message)
        }
    }

    const isFeeTx = addressAmount * 1 <= 0

    let amountTxt = addressAmountPrettyPrefix + ' ' + (isFeeTx ? transactionFeePretty : addressAmountPretty)
    let statusTxt = strings('account.transaction.' + wayType.toLowerCase())
    if (transaction?.transactionFilterType === 'walletConnect') {
        statusTxt = strings('account.transaction.' + wayType.toLowerCase()) + ' WalletConnect'
    }
    if (addressAmountPretty === '?') {
        if (transaction.bseOrderData) {
            amountTxt = '#' + transaction.bseOrderData.orderHash
        }
        if (notification && notification.title) {
            statusTxt = notification.title
            if (notification.newsName === 'ORDER_SUCCESS') {
                status = 'SUCCESS' // @hard fix todo remove
            }
        }
    }
    return (
        <View style={[styles.wrapper, { paddingBottom: GRID_SIZE }]}>
            <View style={{ flexDirection: 'row' }}>
                <Text style={{ ...styles.txDirection, color: colors.common.text1 }}>
                    {capitalize(statusTxt)}
                </Text>
                <View>
                    {arrowIcon}
                </View>
            </View>
            <View style={{ paddingVertical: 8 }}>
                <Text
                    style={styles.date}>{BlocksoftPrettyDates.timestampToPretty(transaction.createdAt)}</Text>
            </View>
            <View style={styles.statusWrapper}>
                <View style={{ ...styles.statusLine, borderBottomColor: color }} />
                <View style={{ paddingHorizontal: 17, backgroundColor: colors.common.header.bg }}>
                    <View style={{ ...styles.statusBlock, backgroundColor: color }}>
                        <LetterSpacing text={prepareStatusHeaderToView(status)}
                            textStyle={{ ...styles.status, color: colors.transactionScreen.status }} letterSpacing={1.5} />
                    </View>
                </View>
            </View>
            <TouchableDebounce onPress={copyToClip}>
                <View style={styles.topContent__title}>
                    <Text style={{ ...styles.amount, color: colors.common.text1 }}>
                        {amountTxt}
                    </Text>
                    <Text style={{ ...styles.code, color: color }}>{currencySymbol}</Text>
                </View>
            </TouchableDebounce>
        </View>
    )

}

export default HeaderTx

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center'
    },
    txDirection: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        paddingRight: 4
    },
    date: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 14,
        color: '#999999'
    },
    statusLine: {
        position: 'absolute',
        borderBottomWidth: 1.5,
        width: '100%',
        top: 14
    },
    statusBlock: {
        height: 30,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        minWidth: 120,
        maxWidth: 180
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -6,
        marginTop: 6
    },
    amount: {
        fontSize: 32,
        fontFamily: 'Montserrat-Medium'
    },
    code: {
        fontSize: 20,
        fontFamily: 'Montserrat-Medium',
        marginBottom: -8,
        paddingLeft: 6
    },
    status: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12
    },
    statusWrapper: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'row',
    }
})
