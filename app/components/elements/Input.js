/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Clipboard, Text, TextInput, View } from 'react-native'

import { TextField } from 'react-native-material-textfield'
import QR from 'react-native-vector-icons/FontAwesome'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'

import NavStore from '@app/components/navigation/NavStore'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'
import GradientView from '@app/components/elements/GradientView'

import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import { capitalize } from '@app/services/UI/Capitalize/Capitalize'
import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'
import Validator from '@app/services/UI/Validator/Validator'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'
import { normalizeInputWithDecimals } from '@app/services/UI/Normalize/NormalizeInput'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'



class Input extends Component {

    constructor(props) {
        super(props)
        this.state = {
            value: '',
            errors: [],
            focus: false,
            autoFocus: false,
            show: false,
            tap: true,
            inputHeight : 0
        }
        this.inputRef = React.createRef()
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({
                show: true
            })
        }, 200)

        setTimeout(() => {
            const { autoFocus } = this.props
            if (typeof autoFocus !== 'undefined') {
                this.setState({
                    autoFocus,
                    show: false
                }, () => {
                    this.setState({
                        show: true
                    })
                })
            }
        }, 500)
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
            if ((cuttype === 'TRX' && value.length<=34) || cuttype === 'FIO') {
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
            value : value,
            valueState : valueState
        }
    }

    render() {

        const { value, show, focus, errors, autoFocus } = this.state
        const {
            id,
            name,
            mark,
            action,
            actionBtnStyles,
            paste,
            copy,
            fio,
            qr,
            style,
            onFocus,
            subTitle,
            disabled,
            qrCallback,
            bottomLeftText,
            keyboardType,
            inputBaseColor,
            inputTextColor,
            markStyle,
            tapText,
            tapCallback,
            tapWrapperStyles,
            tapContentStyles,
            tapTextStyles,
            tapIconStyle = {},
            tintColor,
            validPlaceholder,
            onSubmitEditing,
            noEdit,
            isCapitalize = true,
            isLine = true,
            isTextarea = false
        } = this.props
        const placeholder = isCapitalize ? capitalize(name) : name

        let error = errors.find(item => item.field === id)
        error = typeof error !== 'undefined' ? error.msg : ''
        const isDisabled = typeof disabled !== 'undefined' ? disabled : false

        const lineStyle = {}
        let elementStyle = {}
        if (typeof style !== 'undefined') {
            elementStyle = style
        }


        if (isTextarea) {
            let height = this.state.inputHeight + 30
            if (height < 70) {
                height = 70
            }
            elementStyle.minHeight = height
            elementStyle.maxHeight = height
            lineStyle.top = height - 10
            if (error && height === 70) {
                lineStyle.top = height - 20
            }
        }

        return (
            <View style={{ ...styles.wrapper, ...elementStyle }}>
                {
                    typeof isLine !== 'undefined' && isLine ? <GradientView style={{...styles.line, ...lineStyle}} array={error ? lineStyles_.arrayError : noEdit ? lineStyles_.arrayEdit : lineStyles_.array} start={lineStyles_.start} end={lineStyles_.end}/> : null
                }
                {
                    show ? <TextField
                        ref={ref => this.inputRef = ref}
                        keyboardType={typeof keyboardType !== 'undefined' ? keyboardType : 'default'}
                        tintColor={typeof tintColor !== 'undefined' ? tintColor : styles.tintColor}
                        errorColor={styles.errorColor}
                        labelHeight={styles.labelHeight}
                        baseColor={typeof inputBaseColor !== 'undefined' ? inputBaseColor : '#404040'}
                        textColor={typeof inputTextColor !== 'undefined' ? inputTextColor : '#0D0D0D'}
                        fontSize={19}
                        lineWidth={0}
                        activeLineWidth={0}
                        label={placeholder}
                        value={value}
                        //  returnKeyLabel={'Buy'}
                        // returnKeyType={'done'}
                        onSubmitEditing={typeof onSubmitEditing !== 'undefined' ? onSubmitEditing : () => {
                        }}
                        autoFocus={typeof autoFocus !== 'undefined' && !isDisabled ? autoFocus : false}
                        disabled={isDisabled}
                        disabledLineType={'none'}
                        error={error ? error.toString() : ''}
                        onChangeText={(value) => this.handleInput(value)}
                        style={ noEdit ? {...styles.fontFamily, color: '#999999'} : styles.fontFamily}
                        // style={styles.fontFamily}
                        multiline={isTextarea}
                        autoCorrect={false}
                        spellCheck={false}
                        onBlur={() => {
                            this.setState({ focus: false })
                        }}
                        onContentSizeChange={(e) => {
                            const h =  e.nativeEvent.contentSize.height
                            if (h > 1) {
                                this.setState({ inputHeight: h })
                            }
                        }}
                        onFocus={typeof onFocus === 'undefined' ? () => {
                            this.setState({ focus: true })
                        } : () => {
                            this.setState({ focus: true })
                            onFocus()
                        }}
                    /> : null
                }
                {
                    validPlaceholder ?
                        <TextInput
                            style={[styles.validPlaceholder, !this.state.errors.length && value !== '' && focus === false ? styles.validPlaceholder_active : null, {color: noEdit ? '#999999' : '#0D0D0D'}]}
                            value={BlocksoftPrettyStrings.makeCut(value, 8)}
                            editable={!isDisabled}
                            autoCorrect={false}
                            spellCheck={false}
                            onFocus={() => {
                                this.inputRef.focus()
                            }}
                            allowFontScaling={false}
                        /> : null
                }
                {
                    typeof tapText !== 'undefined' ?
                        <TouchableDebounce disabled={typeof disabled !== 'undefined' ? disabled : false} style={[styles.tap, tapWrapperStyles]} onPress={() => {
                            tapCallback()
                            this.setState({ tap: !this.state.tap })
                        }}>
                            <View style={[styles.tap__content, typeof disabled !== 'undefined' && disabled ? styles.tap__content_disabled : null, tapContentStyles]}>
                                <View style={{
                                    height: 12, transform: [
                                        { rotateX: `${this.state.tap ? '0' : '180'}deg` }
                                    ]
                                }}>
                                    {typeof disabled !== 'undefined' && !disabled ? <Ionicons size={12} name='ios-swap' style={[{ color: '#7127ac', ...tapIconStyle }]}/> : null}
                                </View>
                                 <Text style={{...styles.tap__text, ...tapTextStyles, color: noEdit ? '#999999' : '#7127ac'}}>{tapText}</Text>
                            </View>
                        </TouchableDebounce> : null
                }
                <View style={styles.actions}>
                    {
                        typeof fio !== 'undefined' && fio ?
                            <TouchableDebounce onPress={() => NavStore.goNext('FioChooseRecipient')} style={styles.actionBtn}>
                                <MaterialCommunityIcons style={styles.actionBtn__icon} name="contacts" size={25} color="#855eab"/>
                            </TouchableDebounce> : null
                    }
                    {
                        typeof copy !== 'undefined' && copy ?
                            <TouchableDebounce onPress={this.handleCopyToClipboard} style={[styles.actionBtn]}>
                                <MaterialCommunityIcons style={styles.actionBtn__icon} name="content-copy" size={25} color="#855eab"/>
                            </TouchableDebounce> : null
                    }
                    {
                        typeof paste !== 'undefined' && paste ?
                            <TouchableDebounce onPress={this.handleReadFromClipboard} style={[styles.actionBtn]}>
                                <MaterialCommunityIcons style={styles.actionBtn__icon} name="content-paste" size={25} color="#855eab"/>
                            </TouchableDebounce> : null
                    }
                    {
                        typeof qr !== 'undefined' && qr ?
                            <TouchableDebounce onPress={() => checkQRPermission(qrCallback)} style={styles.actionBtn}>
                                <QR style={{ ...styles.actionBtn__icon_qr, ...styles.actionBtn__icon }} name="qrcode" size={25} color="#855eab"/>
                            </TouchableDebounce> : null
                    }
                </View>
                {
                    typeof action !== 'undefined' && !disabled ?
                        <TouchableDebounce onPress={action.callback} style={[styles.action, actionBtnStyles]}>
                            <View style={styles.action__title}>
                                <Text style={styles.action__title__text}>
                                    {action.title}
                                </Text>
                            </View>
                        </TouchableDebounce> : null
                }
                {
                    typeof subTitle !== 'undefined' ?
                        <Text style={styles.subTitle}>{subTitle}</Text> : null
                }
                <View style={styles.bottomTexts}>
                    <Text numberOfLines={1}>
                        <Text style={{ ...styles.mark, ...markStyle }}>
                            {typeof bottomLeftText !== 'undefined' ? bottomLeftText : ''}
                        </Text>
                        <Text style={{ ...styles.mark, ...markStyle }}>
                            {typeof mark !== 'undefined' ? mark : ''}
                        </Text>
                    </Text>
                </View>

            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        qrCodeScanner: state.qrCodeScannerStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Input)

const lineStyles_ = {
    array: ['#7127ac', '#864dd9'],
    arrayError: ['#e77ca3', '#f0a5af'],
    arrayEdit: ['#999999', '#999999'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = {
    wrapper: {
        flex: 1,
        position: 'relative',
        maxHeight: 70,
        minHeight: 70,
        marginBottom: 10
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    label: {
        fontSize: 30,
        fontFamily: 'SFUIDisplay-Regular'
    },
    input: {
        padding: 0,
        fontSize: 19
    },
    line: {
        position: 'absolute',
        top: 50,
        width: '100%',
        height: 2,
        borderRadius: 2
    },
    error: {
        marginTop: 5,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e77ca3'
    },
    fontFamily: {
        fontFamily: 'SFUIDisplay-Regular',
        marginRight: 110,
        // textDecoration: 'none'
    },
    mark: {
        // position: 'absolute',
        right: 0,
        bottom: 0,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 12,
        color: '#808080'
    },
    action: {
        position: 'absolute',
        right: 0,
        top: -2
    },
    action__title: {
        marginTop: -5,
        height: 30,
        justifyContent: 'center'
    },
    action__title__text: {
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Bold',
        color: '#864dd9'
    },
    actions: {
        position: 'absolute',
        top: -5,
        right: 0,
        flexDirection: 'row'
    },
    actionBtn: {},
    actionBtn__icon: {
        marginLeft: 15,
        marginTop: 20
    },
    actionBtn__icon_qr: {
        marginTop: 2
    },
    tintColor: '#7127ac',
    errorColor: '#e77ca3',
    labelHeight: 15,
    subTitle: {
        marginTop: -5,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#808080'
    },
    bottomLeftText: {
        fontSize: 19
    },
    bottomTexts: {
        marginTop: -4,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'nowrap'
    },
    validPlaceholder: {
        position: 'absolute',
        top: 20,
        left: 0,

        width: '100%',
        maxHeight: 0,
        padding: 0,

        color: '#0D0D0D',
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',

        backgroundColor: '#f9f9f9',
        overflow: 'hidden',
    },
    validPlaceholder_active: {
        maxHeight: 200
    },
    tap: {
        position: 'absolute',
        right: 0,
        top: 20
    },
    tap__content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingVertical: 5,
        borderRadius: 5,
        backgroundColor: '#f2f2f2'
    },
    tap__text: {
        marginLeft: 4,

        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#7127ac'
    },
    tap__content_disabled: {
        backgroundColor: '#f9f9f9'
    }
}
