/**
 * @version 0.43
 */
import React from 'react'
import { View } from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'

import TransactionButton from './TransactionButton'

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
                style={{ ...styles.button, backgroundColor: title ? colors.accountScreen.trxButtonBackgroundColor : colors.homeScreen.tabBarBackground, borderColor: colors.accountScreen.trxButtonBorderColor }}
            />
            <TransactionButton
                text={title && strings('dashboardStack.buy')}
                action={() => actionBuy()}
                type={'buy'}
                style={{ ...styles.button, backgroundColor: title ? colors.accountScreen.trxButtonBackgroundColor : colors.homeScreen.tabBarBackground, borderColor: colors.accountScreen.trxButtonBorderColor }}
            />
            <TransactionButton
                text={title && strings('account.send')}
                action={() => actionSend()}
                type={'send'}
                style={{ ...styles.button, backgroundColor: title ? colors.accountScreen.trxButtonBackgroundColor : colors.homeScreen.tabBarBackground, borderColor: colors.accountScreen.trxButtonBorderColor }}
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
