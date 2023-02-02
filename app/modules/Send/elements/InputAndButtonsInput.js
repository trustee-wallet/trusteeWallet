/**
 * @version 0.77
 * @author yura
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { TextInput, View, Platform, StyleSheet } from 'react-native'

import { ThemeContext } from '@app/theme/ThemeProvider'

import Validator from '@app/services/UI/Validator/Validator'
import { normalizeInputWithDecimals } from '@app/services/UI/Normalize/NormalizeInput'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

class InputAndButtonsInput extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            value: '',
            errors: [],
            focus: false,
            autoFocus: false,
            tap: true,
            inputHeight: 0,

            fontSize: 40
        }
        this.inputRef = React.createRef()
    }

    getValue = () => this.state.value

    handleInput = async (value, useCallback) => {

        if (value === '' && !this.state.focus) {
            value = this.state.value
        }

        const { id, name, type, subtype, cuttype, additional, decimals, callback } = this.props

        const actualDecimals = typeof decimals !== 'undefined' ? decimals : 10
        if (additional === 'NUMBER') {
            value = normalizeInputWithDecimals(value, actualDecimals)
            if (value !== '' && value !== '0.') {
                value = BlocksoftPrettyNumbers.makeCut(value, actualDecimals).separatedForInput
            }
            this.setState( {
                value,
                fontSize: value.length > 8 && value.length < 10 ? 36 : value.length >= 10 && value.length < 12 ? 32 : value.length >= 12 && value.length < 15 ? 28 : value.length >= 15 ? 20 : 40
            })
        } else {
            const validation = await Validator.arrayValidation([{ id, name, type, subtype, cuttype, value }])
            this.setState({
                value : Validator.safeWords(value),
                errors: validation.errorArr,
                fontSize: value.length > 8 && value.length < 10 ? 36 : value.length >= 10 && value.length < 12 ? 32 : value.length >= 12 && value.length < 15 ? 28 : value.length >= 15 ? 20 : 40
            })
        }

        if (typeof callback !== 'undefined' && useCallback !== false) {
            callback(value)
        }
    }

    handleValidate = async () => {
        const { id, name, type, subtype, cuttype } = this.props
        let { value } = this.state
        const valueState = JSON.parse(JSON.stringify(value))

        let validation
        if (cuttype) {
            let valueNew = value.trim().replace(/\n/g, " ")
            const tmpIndex = valueNew.lastIndexOf('[ Photo ]')
            if (tmpIndex !== -1) {
                valueNew = valueNew.slice(tmpIndex + 9).trim()
            }
            if ( ( cuttype === 'TRX' && value.length <= 34 ) || cuttype === 'FIO') {
                // do nothing
                // TRX addresses can start with TRX
            } else if (valueNew.indexOf(cuttype) === 0) {
                valueNew = valueNew.substr(cuttype.length).trim()
            }
            if (valueNew) {
                value = valueNew
            }
        }

        if (Array.isArray(type)) {

            const tmps = []
            let tmp
            for (tmp of type) {
                tmps.push(
                    {
                        id,
                        name,
                        type: tmp,
                        subtype,
                        cuttype,
                        value
                    }
                )
            }
            validation = await Validator.arrayValidation(tmps)

            if (validation.errorArr.length !== type.length) {
                validation = {
                    status: 'success',
                    errorArr: []
                }
            }
        } else {
            const params = {
                id,
                name,
                type,
                subtype,
                cuttype,
                value
            }
            validation = await Validator.arrayValidation([params])
        }

        this.setState({
            value,
            errors: validation.errorArr || validation.message
        })

        return {
            status: validation.status,
            value,
            valueState: valueState
        }
    }

    render() {

        const { value, focus, fontSize } = this.state
        const { onFocus, noEdit, enoughFunds = false,  maxLength, maxWidth = 17 } = this.props

        const { colors } = this.context

        return (
            <View style={styles.wrapper}>
                <TextInput
                    ref={component => this.valueInput = component}
                    keyboardType={'numeric'}
                    placeholder={focus ? '' : '0.00'}
                    placeholderTextColor={colors.sendScreen.amount }
                    fontSize={fontSize}
                    selectionColor={'#7127ac'}
                    textAlign={'center'}
                    value={value}
                    style={noEdit ? { ...styles.fontFamily, color: colors.sendScreen.amount, maxWidth: maxWidth } :
                        { ...styles.fontFamily, color: enoughFunds ? '#864DD9' : colors.sendScreen.amount, maxWidth: maxWidth, lineHeight: fontSize + 4,
                        bottom: Platform.OS === 'android' ? fontSize === 20 ? -6 : 0 : fontSize === 20 ? -4 : 0 }}
                    onChangeText={(value) => this.handleInput(value)}
                    onBlur={() => {
                        this.setState({ focus: false })
                    }}
                    onFocus={typeof onFocus === 'undefined' ? () => {
                        this.setState({ focus: true })
                    } : () => {
                        this.setState({ focus: true })
                        onFocus()
                    }}
                    maxLength={maxLength}
                    autoCorrect={false}
                    spellCheck={false}
                    allowFontScaling={false}
                    />
            </View>
        )
    }
}

InputAndButtonsInput.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(InputAndButtonsInput)

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        minWidth: 100,
        height: 60
    },
    fontFamily: {
        fontFamily: 'Montserrat-Medium',
        height: 72
    },
    labelHeight: 15
})
