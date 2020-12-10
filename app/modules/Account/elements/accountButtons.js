/**
 * @version 0.30
 */

import React, { Component } from 'react'
import TransactionButton from './TransactionButton'
import { View } from 'react-native'
import { useTheme } from '../../theme/ThemeProvider'

import { strings } from '../../../services/i18n'

const AccountButtons = (props) => {

    const { colors } = useTheme()

    const {
        title,
        actionReceive,
        actionBuy,
        actionSend
    } = props

    return (
        <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TransactionButton
                text={title && strings('account.receive', { receive: strings('repeat.receive') })}
                action={() => actionReceive()}
                type={'receive'}
                style={{ ...styles.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
            />
            <TransactionButton
                text={title && strings('dashboardStack.buy')}
                action={() => actionBuy()}
                type={'buy'}
                style={{ ...styles.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
            />
            <TransactionButton
                text={title && strings('account.send')}
                action={() => actionSend()}
                type={'send'}
                style={{ ...styles.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
            />
        </View>
    )
}

export default AccountButtons

const styles = {
    button: {
        borderRadius: 10,
        borderWidth: 2,
        width: '30%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10
    }
}