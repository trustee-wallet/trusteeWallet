/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View } from 'react-native'

import FeeForByteInput from '../../../../components/elements/Input'

import { strings } from '../../../../services/i18n'

import { ThemeContext } from '../../../../modules/theme/ThemeProvider'

class CustomFee extends Component {

    constructor(props) {
        super(props)

        this.state = {
        }

        this.feeForByteInput = React.createRef()
    }


    render() {

        const { colors, GRID_SIZE } = this.context

        return (
            <View style={{ marginTop: 10 }}>
                <View style={{ ...styles.inputWrapper, paddingTop: 10, marginBottom: GRID_SIZE }}>
                    <FeeForByteInput
                        ref={component => this.feeForByteInput = component}
                        id={'feeForByte'}
                        name={strings(`send.fee.customFee.btc.feeForByte`)}
                        type={'EMPTY'}
                        additional={'NUMBER'}
                        placeholer={strings(`send.fee.customFee.btc.satoshi`)}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                        // callback={} //todo
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
