/**
 * @version 0.31
 * @author Vadym
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'

import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'
import Input from '@app/components/elements/NewInput' 
import { ThemeContext } from '@app/theme/ThemeProvider'
import Log from '@app/services/Log/Log'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

class InputWithPercents extends React.Component {

    state = {
        partBalance: null
    }

    handlePartBalance = (newPartBalance) => {

        const { balance } = this.props

        let transferAllBalance = balance

        Log.log('SettingsTRX.Input.handlePartBalance ' + newPartBalance + ' clicked')
        this.setState({
            partBalance: newPartBalance
        }, async () => {
            let cryptoValue
            if (this.state.partBalance === 4) {
                cryptoValue = transferAllBalance
            } else {
                cryptoValue = BlocksoftUtils.mul(BlocksoftUtils.div(transferAllBalance, 4), this.state.partBalance)
            }
            const pretty = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(cryptoValue)
            Log.log('SettingsTRX.Input.handlePartBalance ' + newPartBalance + ' end counting ' + cryptoValue + ' => ' + pretty)
            this.freezeAmountInput.handleInput(pretty)
        })
    }

    render() {
        const { GRID_SIZE } = this.context

    const { 
        placeholder,
        inputRef
    } = this.props

    const { partBalance } = this.state

    return(
            <>
                <View style={styles.inputWrapper}>
                    <Input
                        style={{ height: 55 }}
                        containerStyle={{ height: 55 }}
                        ref={inputRef}
                        id={'freezeAmount'}
                        name={placeholder}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                    />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: GRID_SIZE * 1.5 }}>
                    <InputAndButtonsPartBalanceButton
                        action={() => this.handlePartBalance(1)}
                        text='25%'
                        inverse={partBalance === 1}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => this.handlePartBalance(2)}
                        text='50%'
                        inverse={partBalance === 2}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => this.handlePartBalance(3)}
                        text='75%'
                        inverse={partBalance === 3}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => this.handlePartBalance(4)}
                        text='100%'
                        inverse={partBalance === 4}
                    />
                </View>
            </>
        )
    }

    
}

export default InputWithPercents

InputWithPercents.contextType = ThemeContext

const styles = StyleSheet.create({
    inputWrapper: {
        justifyContent: 'center',
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    }
})