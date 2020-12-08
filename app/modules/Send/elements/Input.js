/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Clipboard, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { TextField } from 'react-native-material-textfield'
import QR from 'react-native-vector-icons/FontAwesome'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'

import GradientView from '../../../components/elements/GradientView'

import copyToClipboard from '../../../services/UI/CopyToClipboard/CopyToClipboard'
import { capitalize } from '../../../services/UI/Capitalize/Capitalize'
import { checkQRPermission } from '../../../services/UI/Qr/QrPermissions'
import Validator from '../../../services/UI/Validator/Validator'
import Toast from '../../../services/UI/Toast/Toast'
import { strings } from '../../../services/i18n'
import { normalizeInputWithDecimals } from '../../../services/UI/Normalize/NormalizeInput'
import BlocksoftPrettyStrings from '../../../../crypto/common/BlocksoftPrettyStrings'

import Log from '../../../services/Log/Log'
import NavStore from '../../../components/navigation/NavStore'

class Input extends Component {

    constructor(props) {
        super(props)
        this.state = {
            value: '',
            errors: [],
            focus: false,
            autoFocus: false,
            tap: true,
            inputHeight: 0
        }
        this.inputRef = React.createRef()
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(props) {
        const { qr, qrCodeScanner } = this.props
        if (qr && props.qrCodeScanner.value && props.qrCodeScanner.value !== qrCodeScanner.value) {
            this.setState({
                value: props.qrCodeScanner.value
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
                value
            })
        } else {
            const validation = await Validator.arrayValidation([{ id, name, type, subtype, cuttype, value }])
            this.setState({
                value,
                errors: validation.errorArr
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
            if (cuttype === 'TRX' && value.length <= 34 || cuttype === 'FIO') {
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
            Log.log('Input.handleValidate one', { validation, params })
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

        const { value, focus, errors, autoFocus } = this.state
        const {
            id,
            name,
            style,
            onFocus,
            disabled,
            keyboardType,
            inputBaseColor,
            inputTextColor,
            tabText,
            tintColor,
            onSubmitEditing,
            noEdit,
            isCapitalize = true,
            isTextarea = false,
            enoughFunds = false
        } = this.props
        const placeholder = isCapitalize ? capitalize(name) : name

        let error = errors.find(item => item.field === id)
        error = typeof error !== 'undefined' ? error.msg : ''
        const isDisabled = typeof disabled !== 'undefined' ? disabled : false

        return (
            <View style={styles.wrapper}>
                <TextField
                    ref={ref => this.inputRef = ref}
                    keyboardType={typeof keyboardType !== 'undefined' ? keyboardType : 'numeric'}
                    tintColor={typeof tintColor !== 'undefined' ? tintColor : styles.tintColor}
                    fontSize={40}
                    lineWidth={0}
                    activeLineWidth={0}
                    placeholder={'0.00'}
                    placeholderTextColor="#404040"
                    textAlign={'center'}
                    value={value}
                    onSubmitEditing={typeof onSubmitEditing !== 'undefined' ? onSubmitEditing : () => {
                    }}
                    editable={!noEdit ? true : false}
                    onChangeText={(value) => this.handleInput(value)}
                    style={noEdit ? { ...styles.fontFamily, color: '#999999' } : { ...styles.fontFamily, color: enoughFunds ? '#864DD9' : '' }}
                    autoCorrect={false}
                    spellCheck={false}
                    onBlur={() => {
                        this.setState({ focus: false })
                    }}
                    onFocus={typeof onFocus === 'undefined' ? () => {
                        this.setState({ focus: true })
                    } : () => {
                        this.setState({ focus: true })
                        onFocus()
                    }}
                />
            </View>
        )
    }
}

export default connect(null, null, null, { forwardRef: true })(Input)

const styles = {
    wrapper: {
        flex: 1,
        position: 'relative',
        maxHeight: 70,
        minHeight: 70,
        marginBottom: 10
    },
    fontFamily: {
        fontFamily: 'Montserrat-Medium',
        height: 52
    },
    tintColor: '#7127ac',
    errorColor: '#e77ca3',
    labelHeight: 15
}