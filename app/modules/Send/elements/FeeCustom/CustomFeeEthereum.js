/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View, Text, TouchableOpacity } from 'react-native'

import { strings } from '../../../../services/i18n'

import GasPriceAmountInput from '../../../../components/elements/Input'
import GasLimitAmountInput from '../../../../components/elements/Input'
import Nonce from '../../../../components/elements/Input'

import { ThemeContext } from '../../../../modules/theme/ThemeProvider'

const CACHE_PREV_OK = {}

class CustomFee extends Component {

    constructor(props) {
        super(props)

        this.state = {
        }

        this.gasPriceInput = React.createRef()
        this.gasLimitInput = React.createRef()
        this.nonceInput = React.createRef()
    }

    render() {

        const { colors, GRID_SIZE } = this.context

        return (
            <View style={{ marginTop: 10 }}>
                <View style={{ ...styles.inputWrapper, paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <GasPriceAmountInput
                        ref={ref => this.gasPriceInput = ref}
                        id={'gasPrice'}
                        name={strings(`send.fee.customFee.eth.gasPrice`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        placeholder={strings(`send.fee.customFee.eth.gwei`)}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                    // callback={} //todo
                    />
                </View>
                <View style={{ ...styles.inputWrapper, paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <GasLimitAmountInput
                        ref={ref => this.gasLimitInput = ref}
                        id={'gasLimit'}
                        placeholder={strings(`send.fee.customFee.eth.gasLimit`)}
                        name={strings(`send.fee.customFee.eth.gasLimit`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                        disabled={this.props.useAllFunds}
                    // callback={} //todo
                    />
                </View>
                <View style={{ ...styles.inputWrapper, paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <Nonce
                        ref={ref => this.nonceInput = ref}
                        id={'nonce'}
                        placeholder={strings(`send.fee.customFee.eth.nonce`)}
                        name={strings(`send.fee.customFee.eth.nonce`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                    />
                </View>
            </View>
        )
    }
}

CustomFee.contextType = ThemeContext

export default CustomFee

const styles = {
    inputWrapper: {
        justifyContent: 'center',
        height: 50,
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
}