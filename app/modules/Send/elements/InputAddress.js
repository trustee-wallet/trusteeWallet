/**
 * @version 0.77
 */
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { strings } from '@app/services/i18n'

import NavStore from '@app/components/navigation/NavStore'
import AddressInput from '@app/components/elements/NewInput'
import { ThemeContext } from '@app/theme/ThemeProvider'

import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { SendActionsContactBook } from '@app/appstores/Stores/Send/SendActionsContactBook'

const addressInput = {
    id: 'address',
    type: 'ETH_ADDRESS'
}

class InputAddress extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            addressError: false,
            addressErrorText: ''
        }
        this.addressInput = React.createRef()
    }

    componentDidMount() {
        if (this.addressInput) {
            this.addressInput.handleInput(this.props.sendScreenStoreValue, false)
        }
    }

    componentDidUpdate(prevProps) {
        if (this.addressInput && prevProps.sendScreenStoreValue !== this.props.sendScreenStoreValue) {
            this.addressInput.handleInput(this.props.sendScreenStoreValue, false)
        }
    }

    handleChangeAddress = () => {
        this.setState(() => ({ addressError: false }))
    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 120 })
            } catch (e) {
            }
        }, 500)
    }

    async disabledGotoWhy() {

        if (typeof this.addressInput.state === 'undefined' || this.addressInput.state.value === '') {
            this.setState({
                addressError: true,
                addressErrorText: ''
            })
            return {
                status: 'fail'
            }
        }

        const { currencyCode } = this.props.sendScreenStoreDict
        const addressValidation = await this.addressInput.handleValidate()
        let addressTo = addressValidation.value
        let addressName = false

        try {
            const tmp = await SendActionsContactBook.getContactAddress({ addressName: addressTo, currencyCode })
            if (tmp) {
                addressName = addressTo
                addressTo = tmp
                addressValidation.status = 'success'
            }
        } catch (e) {
            this.setState({
                addressError: true,
                addressErrorText: e.message
            })
            return {
                status: 'fail'
            }
        }


        if (addressValidation.status !== 'success') {
            this.setState({
                addressError: true,
                addressErrorText: ''
            })
            return {
                status: 'fail'
            }
        }

        if (this.state.addressError) {
            this.setState({
                addressError: false
            })
        }

        return {
            status: 'success',
            value: addressTo,
            addressName
        }
    }

    renderAddressError = () => {
        const { addressError, addressErrorText } = this.state
        const { colors, GRID_SIZE } = this.context

        if (!addressError) return
        return (
            <View style={{ marginVertical: GRID_SIZE }}>
                <View style={style.texts}>
                    <View style={style.texts__icon}>
                        <Icon
                            name='information-outline'
                            size={22}
                            color='#864DD9'
                        />
                    </View>
                    <Text style={{ ...style.texts__item, color: colors.common.text3 }}>
                        {addressErrorText === '' ? strings('send.addressError') : addressErrorText}
                    </Text>
                </View>
            </View>
        )

    }

    handleOpenQr = () => {
        const { currencyCode } = this.props.sendScreenStoreDict
        setQRConfig({ currencyCode: currencyCode, flowType: QRCodeScannerFlowTypes.SEND_SCANNER, callback: (data) => {
            // actually updated in store but can recheck here or rerender if needed
            NavStore.goBack()
        }})
        NavStore.goNext('QRCodeScannerScreen')
    }

    render() {
        const { GRID_SIZE } = this.context
        const { currencySymbol, currencyCode, extendsProcessor, addressUiChecker, network } = this.props.sendScreenStoreDict

        let extendedAddressUiChecker = (typeof addressUiChecker !== 'undefined' && addressUiChecker ? addressUiChecker : extendsProcessor)
        if (!extendedAddressUiChecker) {
            extendedAddressUiChecker = currencyCode
        }

        return (
            <View>
                <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5 }}>
                    <AddressInput
                        ref={component => this.addressInput = component}
                        id={addressInput.id}
                        onFocus={() => this.onFocus()}
                        name={strings('send.address')}
                        type={extendedAddressUiChecker.toUpperCase() + '_ADDRESS'}
                        subtype={network}
                        cuttype={currencySymbol}
                        paste={true}
                        fio={false}
                        copy={false}
                        qr={true}
                        onChangeText={this.handleChangeAddress}
                        callback={this.handleChangeAddress}
                        addressError={false}
                        qrCallback={this.handleOpenQr}
                        validPlaceholder={true}
                    />
                </View>
                {this.renderAddressError()}
            </View>
        )
    }
}

InputAddress.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(InputAddress)

const style = StyleSheet.create({
    inputWrapper: {
        justifyContent: 'center',
        // height: 50,
        borderRadius: 10,
        elevation: 8,
        // marginTop: 32,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        }
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    }
})
