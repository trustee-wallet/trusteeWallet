/**
 * @version 0.77
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Clipboard, TextInput, View, Platform } from 'react-native'

import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Validator from '@app/services/UI/Validator/Validator'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'
import { normalizeInputWithDecimals } from '@app/services/UI/Normalize/NormalizeInput'

import { ThemeContext } from '@app/theme/ThemeProvider'


class AccountReceiveInput extends Component {

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

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(props) {
        const { qr, qrCodeScanner } = this.props
        if (qr && props.qrCodeScanner.value && props.qrCodeScanner.value !== qrCodeScanner.value) {
            const value = props.qrCodeScanner.value
            this.setState({
                value,
                fontSize: value.length > 8 && value.length < 10 ? 36 : value.length >= 10 && value.length < 12 ? 32 : value.length >= 12 && value.length < 15 ? 28 : value.length >= 15 ? 20 : 40
            })
        }
    }

    handleForceUpdate = () => {
        this.forceUpdate()
    }

    getValue = () => this.state.value

    handleReadFromClipboard = async () => {
        const clipboardContent = await Clipboard.getString()
        this.setState({ value: clipboardContent }, () => {
            this.handleValidate()
        })

    }

    handleInput = async (value, useCallback) => {

        value === '' && !this.state.focus ? value = this.state.value : value

        const { id, name, type, subtype, cuttype, additional, decimals, callback, isTextarea = false } = this.props

        if (additional === 'NUMBER') {
            value = normalizeInputWithDecimals(value, typeof decimals !== 'undefined' ? decimals : 5)
            this.setState({
                value,
                fontSize: value.length > 8 && value.length < 10 ? 36 : value.length >= 10 && value.length < 12 ? 32 : value.length >= 12 && value.length < 15 ? 28 : value.length >= 15 ? 20 : 40
            })
        } else {
            const validation = await Validator.arrayValidation([{ id, name, type, subtype, cuttype, value }])
            this.setState({
                value,
                errors: validation.errorArr,
                fontSize: value.length > 8 && value.length < 10 ? 36 : value.length >= 10 && value.length < 12 ? 32 : value.length >= 12 && value.length < 15 ? 28 : value.length >= 15 ? 20 : 40
            })
        }

        if (typeof callback !== 'undefined' && useCallback !== false) {
            callback(value)
        }
    }

    handleCopyToClipboard = () => {
        copyToClipboard(this.state.value)

        Toast.setMessage(strings('toast.copied')).show()
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
            value = Validator.safeWords(value)
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
            if (type !== 'MNEMONIC_PHRASE') {
                value = Validator.safeWords(value)
            }
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
            value: value,
            valueState: valueState
        }
    }

    render() {

        const { value, fontSize } = this.state
        const {
            onFocus,
            noEdit,
            enoughFunds = false,
            maxLength,
            maxWidth = 17,
            focused,
            onBlur
        } = this.props

        const { colors } = this.context

        return (
            <View style={styles.wrapper}>
                <TextInput
                    ref={component => this.valueInput = component}
                    keyboardType={'numeric'}
                    placeholder={focused === true ? '' : '0.00'}
                    placeholderTextColor={colors.sendScreen.amount }
                    fontSize={this.state.fontSize}
                    selectionColor={'#7127ac'}
                    textAlign={'center'}
                    value={value}
                    style={noEdit ? { ...styles.fontFamily, color: colors.sendScreen.amount, maxWidth: maxWidth } :
                        { ...styles.fontFamily, color: enoughFunds ? '#864DD9' : colors.sendScreen.amount, maxWidth: maxWidth, lineHeight: fontSize + 4,
                        bottom: Platform.OS === 'android' ? fontSize === 20 ? -6 : 0 : fontSize === 20 ? -4 : 0 }}
                    onChangeText={(value) => this.handleInput(value)}
                    onBlur={typeof onBlur === 'undefined' ? () => {
                        this.setState({ focus: false })
                    } : () => {
                        this.setState({ focus: false })
                        onBlur()
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

AccountReceiveInput.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(AccountReceiveInput)

const styles = {
    wrapper: {
        position: 'relative',
        minWidth: 100,
        height: 60
    },
    fontFamily: {
        fontFamily: 'Montserrat-Medium',
        height: 72
    },
    errorColor: '#e77ca3',
    labelHeight: 15
}
