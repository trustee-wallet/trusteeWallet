/**
 * @version 0.30
 * @author yura
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Clipboard, Text, TouchableOpacity, View, Platform } from 'react-native'

import { TextField } from 'react-native-material-textfield'
import QR from 'react-native-vector-icons/FontAwesome'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import { capitalize } from '@app/services/UI/Capitalize/Capitalize'
import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'
import Validator from '@app/services/UI/Validator/Validator'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'
import { normalizeInputWithDecimals } from '@app/services/UI/Normalize/NormalizeInput'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import Log from '@app/services/Log/Log'
import NavStore from '../navigation/NavStore'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'


class Input extends Component {

    constructor(props) {
        super(props)
        this.state = {
            value: '',
            errors: [],
            focus: false,
            autoFocus: false,
            show: true,
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
        const { callback } = this.props

        const clipboardContent = await Clipboard.getString()
        this.setState({ value: clipboardContent }, () => {
            this.handleValidate()
        })
        if (typeof callback !== 'undefined') {
            callback(clipboardContent)
        }

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

        const { colors } = this.context
        const { value, show, focus, errors, autoFocus } = this.state
        const {
            id,
            name,
            action,
            actionBtnStyles,
            paste,
            copy,
            fio,
            qr,
            style,
            onFocus,
            disabled,
            qrCallback,
            keyboardType,
            tintColor,
            validPlaceholder,
            onSubmitEditing,
            noEdit,
            isCapitalize = true,
            isTextarea = false,
            info,
            tabInfo,
            adrressError
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

        const inputWidth = ( fio || copy || paste || qr || info || tabInfo ) ? '75%' : '95%'

        return (
            <View style={{ ...styles.wrapper, ...elementStyle, backgroundColor: colors.sendScreen.addressBg, borderRadius: 10 }}>
                {
                    show ?
                        <View style={{ backgroundColor: colors.sendScreen.addressBg, width: inputWidth, borderRadius: 10}} >
                            <TextField
                                ref={ref => this.inputRef = ref}
                                keyboardType={typeof keyboardType !== 'undefined' ? keyboardType : 'default'}
                                tintColor={typeof tintColor !== 'undefined' ? tintColor : styles.tintColor}
                                labelHeight={styles.labelHeight}
                                fontSize={19}
                                lineWidth={0}
                                activeLineWidth={0}
                                placeholder={placeholder}
                                placeholderTextColor="#999999"
                                placeholderStyle={{ ...styles.fontFamily, fontFamily: 'Montserrat-Semibold' }}
                                value={validPlaceholder ? !this.state.errors.length && value !== '' && focus === false ? BlocksoftPrettyStrings.makeCut(value, 8) : value : value}
                                returnKeyLabel={'Buy'}
                                onSubmitEditing={typeof onSubmitEditing !== 'undefined' ? onSubmitEditing : () => {
                                }}
                                autoFocus={typeof autoFocus !== 'undefined' && !isDisabled ? autoFocus : false}
                                disabled={isDisabled}
                                disabledLineType={'none'}
                                onChangeText={(value) => this.handleInput(value)}
                                style={noEdit ? { ...styles.fontFamily, color: colors.sendScreen.amount } : { ...styles.fontFamily, color: adrressError && error ? '#864DD9' : colors.sendScreen.amount }}
                                multiline={isTextarea}
                                autoCorrect={false}
                                spellCheck={false}
                                onBlur={() => {
                                    this.setState({ focus: false })
                                }}
                                onContentSizeChange={(e) => {
                                    const h = e.nativeEvent.contentSize.height
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
                            />
                        </View>
                        : null
                }
                <View style={{...styles.actions }}>
                    {
                        typeof fio !== 'undefined' && fio ?
                            <TouchableOpacity onPress={() => NavStore.goNext('FioChooseRecipient')} style={styles.actionBtn}>
                                <MaterialCommunityIcons style={{...styles.actionBtn__icon, paddingTop: 2}} name="contacts" size={25} color={adrressError && error ? '#864DD9' : colors.common.text1} />
                            </TouchableOpacity> : null
                    }
                    {
                        typeof copy !== 'undefined' && copy ?
                            <TouchableOpacity onPress={this.handleCopyToClipboard} style={[styles.actionBtn]}>
                                <MaterialCommunityIcons style={{...styles.actionBtn__icon, paddingTop: 2}} name="content-copy" size={25} color={adrressError && error ? '#864DD9' : colors.common.text1} />
                            </TouchableOpacity> : null
                    }
                    {
                        typeof paste !== 'undefined' && paste ?
                            <TouchableOpacity onPress={this.handleReadFromClipboard} style={[styles.actionBtn]}>
                                <MaterialCommunityIcons style={{...styles.actionBtn__icon, paddingTop: 2}} name="content-paste" size={25} color={adrressError && error ? '#864DD9' : colors.common.text1} />
                            </TouchableOpacity> : null
                    }
                    {
                        typeof qr !== 'undefined' && qr ?
                            <TouchableOpacity onPress={() => checkQRPermission(qrCallback)} style={styles.actionBtn}>
                                <QR style={{ ...styles.actionBtn__icon_qr, ...styles.actionBtn__icon, paddingTop: 2 }} name="qrcode" size={25} color={adrressError && error ? '#864DD9' : colors.common.text1} />
                            </TouchableOpacity> : null
                    }
                    {
                        typeof info !== 'undefined' && typeof tabInfo !== 'undefined' && info && tabInfo ?
                            <TouchableOpacity onPress={tabInfo} style={styles.actionBtn}>
                                <MaterialCommunityIcons
                                    name="information-outline"
                                    size={25}
                                    color={error ? '#864DD9' : colors.common.text1}
                                    style={{ ...styles.actionBtn__icon_qr, ...styles.actionBtn__icon, paddingTop: 2 }}
                                />
                            </TouchableOpacity> : null
                    }
                </View>
                {
                    typeof action !== 'undefined' && !disabled ?
                        <TouchableOpacity onPress={action.callback} style={[styles.action, actionBtnStyles]}>
                            <View style={styles.action__title}>
                                <Text style={styles.action__title__text}>
                                    {action.title}
                                </Text>
                            </View>
                        </TouchableOpacity> : null
                }
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

Input.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Input)

const styles = {
    wrapper: {
        flex: 1,
        position: 'relative',

        zIndex: 3,
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
        fontFamily: 'SFUIDisplay-Semibold',
        marginLeft: 16,
        marginTop: -3,
        letterSpacing: 1,
    },
    mark: {
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
        right: 0,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 16,
    },
    actionBtn: {},
    actionBtn__icon: {
        marginLeft: 15,
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
        top: -20,
        left: 0,

        width: '100%',
        maxHeight: 0,
        padding: 0,

        color: '#0D0D0D',
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',

        overflow: 'hidden',
        backgroundColor: 'red'
    },
    validPlaceholder_active: {
        maxHeight: 200,
        backgroundColor: 'green'
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
    },
    inputShadow: {

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: 58,

        zIndex: 1
    },
    shadow__item: {
        flex: 1,

        marginHorizontal: 4,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

        backgroundColor: '#fff',

        borderRadius: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    },

    shadow__item__android: {
        flex: 1,

        marginHorizontal: 4,
        marginTop: 11,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

        backgroundColor: '#fff',

        width: 350,
        height: 63,
        border: 6,
        radius: 16,
        opacity: 0.07,
        x: 0,
        y: 0,
        style: {
            flexDirection: 'row',
            position: 'absolute',
        }
    },
}
