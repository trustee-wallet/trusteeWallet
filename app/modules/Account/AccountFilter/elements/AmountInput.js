/**
 * @version 0.52
 * @author yura
 */

import React from 'react'
import { View, LayoutAnimation, StyleSheet, Dimensions } from 'react-native'
import { connect } from 'react-redux'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'

import TextAndButton from '@app/components/elements/new/TextAndButton'
import TextInput from '@app/components/elements/NewInput'
import Button from '@app/components/elements/new/buttons/Button'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class AmountInputContainer extends React.Component {

    state = {
        show: false
    }

    valueInput = React.createRef()

    customLayoutAnimation = {
        duration: 500,
        create: {
            type: LayoutAnimation.Types.linear,
            property: LayoutAnimation.Properties.opacity,
        },
        update: {
            type: LayoutAnimation.Types.spring,
            springDamping: 1.2
        },
        delate: {
            type: LayoutAnimation.Types.linear,
            property: LayoutAnimation.Properties.opacity,
        }
    };

    trigerAmountShow = () => {
        LayoutAnimation.configureNext(this.customLayoutAnimation)
        this.setState({
            show: !this.state.show
        })
    }

    handleChange = async () => {
        this.trigerAmountShow()

        try {
            const value = await this.valueInput.getValue()
            this.props.onChange(value)   
        } catch (e) {
            console.log(e)
        }
    }

    render() {

        const { value, currencyCode, side } = this.props

        const { GRID_SIZE } = this.context

        return (
            <>
                <TextAndButton
                    title={side === 'out' ? strings('account.transaction.endAmount') : strings('account.transaction.startAmount')}
                    buttonText={value === '' ? strings('account.transaction.setAmount') : `${value} ${currencyCode}`}
                    onPress={this.trigerAmountShow}
                />
                {this.state.show ?
                    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: GRID_SIZE * 1.5 }}>
                        <View style={[styles.amountInput, { marginTop: GRID_SIZE, width: SCREEN_WIDTH * 0.6, height: 50 }]}>
                            <TextInput
                                ref={component => this.valueInput = component}
                                name={strings('account.transactionScreen.transactionAmount', { currencyCode })}
                                type='TRANSACTION_AMOUNT'
                                id='TRANSACTION_AOUNT'
                                additional='NUMBER'
                                validPlaceholder={true}
                                keyboardType='numeric'
                                containerStyle={{ height: 50 }}
                                inputStyle={{ marginTop: -6 }}
                            />
                        </View>
                        <View style={{ marginTop: GRID_SIZE }}>
                            <Button
                                containerStyle={{ width: 50, height: 50, padding: 0 }}
                                iconType='sendMessage'
                                onPress={this.handleChange}
                            />
                        </View>
                    </View>
                    : null}
            </>
        )

    }
}

AmountInputContainer.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(AmountInputContainer)

const styles = StyleSheet.create({
    amountInput: {
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