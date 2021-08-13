/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, TouchableOpacity, Dimensions, Text, Platform, ScrollView } from 'react-native'

import { connect } from 'react-redux'
import Modal from 'react-native-modal'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { hideModal, showModal } from '@app/appstores/Stores/Modal/ModalActions'

import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import Log from '@app/services/Log/Log'
import Input from '@app/components/elements/Input'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import UIDict from '@app/services/UIDict/UIDict'
import { FileSystem } from '@app/services/FileSystem/FileSystem'
import Fontisto from 'react-native-vector-icons/Fontisto'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { normalizeInputWithDecimals } from '@app/services/UI/Normalize/NormalizeInput'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const { height: WINDOW_HEIGHT } = Dimensions.get('window')

class CustomReceiveAmountModal extends Component {

    constructor(props) {
        super(props)
        this.state = {
            value: '',
            visible: false,
            dataForQr: '',
            inputType: 'CRYPTO',

            amountInputMark: '',
            amountForQr: '',
            labelForQr: ''
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {

        const dataForQr = this.getDataForQR(this.state.value)

        let tmp = false
        if (dataForQr && typeof dataForQr !== 'undefined' && dataForQr !== null) {
            tmp = JSON.stringify(dataForQr)
            if (tmp) {
                tmp = tmp.replace(/"/g, '')
            }
        }
        this.setState({
            dataForQr: tmp
        })
    }

    componentDidMount() {
        this.amountInputCallback('')
    }

    handleHide = () => {
        hideModal()
    }

    handleShare = () => {
        const { address, currencySymbol } = this.props.data.data
        try {
            setLoaderStatus(true)
            this.refSvg.toDataURL(async (data) => {
                const message = `${currencySymbol}
                ${address}`

                if (Platform.OS === 'android') {
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: `data:image/png;base64,${data}`, title : 'QR', type: 'image/png' })
                } else {
                    const fs = new FileSystem({fileEncoding: 'base64', fileName : 'QR', fileExtension : 'jpg'})
                    await fs.writeFile(data)
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: await fs.getPathOrBase64() })
                }
                setLoaderStatus(false)
            })
        } catch (e) {
            setLoaderStatus(false)
            showModal({
                type: 'CUSTOM_RECEIVE_AMOUNT_MODAL',
                data: {
                    title: JSON.stringify(e)
                }
            })
        }
    }

    getDataForQR = (amount, label) => {
        try {
            const { address, currencySymbol, currencyCode } = this.props.data.data

            const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
            let linkForQR = ''

            if (typeof extend.addressCurrencyCode !== 'undefined') {
                let currencyName = BlocksoftDict.Currencies[extend.addressCurrencyCode].currencyName
                currencyName = currencyName.toLowerCase().replace(' ', '')

                linkForQR = `${currencyName}:${address}?contractAddress=${extend.tokenAddress}&symbol=${currencySymbol}${amount * 1 !== 0 ? `&amount=${amount}` : ''}${label ? `&label=${label}` : ''}`
            } else {
                linkForQR = `${extend.currencyName.toLowerCase().replace(' ', '')}:${address}${amount * 1 !== 0 ? `?amount=${amount}` : ''}${label ? `&label=${label}` : ''}`
            }

            return linkForQR
        } catch (e) {
            Log.err('CustomReceiveAmountModal/getDataForQR error', e.message)
        }
    }

    createDataForQr = (amount, label) => {

        const tmpValue = normalizeInputWithDecimals(amount, 10)

        const dataForQr = this.getDataForQR(tmpValue, label)


        let tmp = false
        if (dataForQr && typeof dataForQr !== 'undefined' && dataForQr !== null) {
            tmp = JSON.stringify(dataForQr)
            if (tmp) {
                tmp = tmp.replace(/"/g, '')
            }
        }
        return tmp
    }

    copyToClip = () => {
        const { address } = this.props.data.data

        copyToClipboard(address)

        Toast.setMessage(strings('toast.copied')).show(40)
    }

    amountInputCallback = (value) => {
        const { currencySymbol, currencyCode } = this.props.mainStore.selectedCryptoCurrency
        const { basicCurrencySymbol, basicCurrencyRate } = this.props.mainStore.selectedAccount

        let amount = '0'
        let symbol = currencySymbol
        try {
            if (!value || value === 0) {
                amount = '0'
                symbol = this.state.inputType === 'CRYPTO' ? basicCurrencySymbol : currencySymbol
            } else if (this.state.inputType === 'CRYPTO') {
                amount = RateEquivalent.mul({ value, currencyCode, basicCurrencyRate })
                symbol = basicCurrencySymbol
            } else {
                amount = RateEquivalent.div({ value, currencyCode, basicCurrencyRate })
            }
        } catch (e) {
            Log.log('SendScreen equivalent error ' + e.message)
        }

        const amountForQr = this.state.inputType === 'CRYPTO' ? value : amount

        this.setState({
            amountEquivalent: amount,
            amountInputMark: strings('send.equivalent', { amount, symbol }),
            amountForQr
        })
    }

    handleChangeEquivalentType = () => {
        const { currencySymbol } = this.props.mainStore.selectedCryptoCurrency
        const { basicCurrencyCode } = this.props.mainStore.selectedAccount

        const inputType = this.state.inputType === 'CRYPTO' ? 'FIAT' : 'CRYPTO'

        let amountEquivalent

        const toInput = (!(1 * this.state.amountEquivalent) ? '' : this.state.amountEquivalent).toString()
        const toEquivalent = !this.refAmountInput.getValue() ? '' : this.refAmountInput.getValue()

        if (inputType === 'FIAT') {
            amountEquivalent = toEquivalent
            this.refAmountInput.handleInput(toInput)
        } else {
            amountEquivalent = toEquivalent
            this.refAmountInput.handleInput(toInput)
        }

        const amountForQr = this.state.inputType === 'CRYPTO' ? this.refAmountInput.getValue() : amountEquivalent

        this.setState({
            amountInputMark: strings('send.equivalent', {
                amount: amountEquivalent === '' ? '0' : amountEquivalent,
                symbol: this.state.inputType === 'FIAT' ? basicCurrencyCode : currencySymbol
            }),
            amountEquivalent,
            inputType,
            amountForQr
        })
    }

    render() {

        const { amountInputMark } = this.state
        const { title, address, currencySymbol } = this.props.data.data
        const { basicCurrencyCode, currencyCode } = this.props.mainStore.selectedAccount

        return (
            <Modal style={{ padding: 0, margin: 0, justifyContent: 'flex-end' }} visible={this.props.show}>
                {
                    Platform.OS === 'ios' ?
                        <ScrollView contentContainerStyle={{ height: WINDOW_HEIGHT, justifyContent: 'flex-end' }}>
                            <KeyboardAwareView>
                                <View style={styles.content}>
                                    <View style={styles.top}>
                                        <TouchableOpacity style={{ padding: 20 }} onPress={this.handleShare}>
                                            <Fontisto color={'#404040'} size={18} name={'share'}/>
                                        </TouchableOpacity>
                                        <Text style={styles.title}>
                                            {title}
                                        </Text>
                                        <TouchableOpacity style={{ padding: 20 }} onPress={this.handleHide}>
                                            <AntDesignIcon name='close' size={22} color='#404040'/>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.input}>
                                        <View style={{ flex: 1, paddingRight: 30 }}>
                                            <Input
                                                ref={component => this.reLabelInput = component}
                                                id={'labelInput'}
                                                name={strings('send.comment')}
                                                type={'OPTIONAL'}
                                                decimals={10}
                                                isLine={false}
                                                tintColor={new UIDict(currencyCode).settings.colors.mainColor}
                                                callback={(value) => this.setState({ labelForQr: value })}/>
                                            <View style={{ width: '100%', height: 1, marginTop: -30, marginBottom: 10, backgroundColor: '#8e96b5' }} />
                                            <Input
                                                ref={component => this.refAmountInput = component}
                                                id={'amountInput'}
                                                placeholder={'0'}
                                                autoFocus={true}
                                                name={strings('exchange.mainData.amount')}
                                                type={'OPTIONAL'}
                                                keyboardType={'numeric'}
                                                additional={'NUMBER'}
                                                tapText={this.state.inputType === 'FIAT' ? basicCurrencyCode : currencySymbol}
                                                tapCallback={this.handleChangeEquivalentType}
                                                isLine={false}
                                                disabled={false}
                                                tintColor={new UIDict(currencyCode).settings.colors.mainColor}
                                                tapWrapperStyles={{ top: 15 }}
                                                tapIconStyle={{ color: new UIDict(currencyCode).settings.colors.mainColor }}
                                                tapTextStyles={{ color: new UIDict(currencyCode).settings.colors.mainColor }}
                                                callback={(value) => this.amountInputCallback(value, true)}
                                                markStyle={{ flex: 1 }}
                                                bottomLeftText={amountInputMark}/>
                                            <View style={{ width: '100%', height: 1, marginTop: -30, marginBottom: 10, backgroundColor: '#8e96b5' }} />
                                        </View>
                                        <View>
                                            <QrCodeBox
                                                getRef={ref => this.refSvg = ref}
                                                size={140}
                                                logo={qrLogo}
                                                logoSize={30}
                                                value={this.createDataForQr(this.state.amountForQr, this.state.labelForQr)}
                                                onError={(e) => {
                                                    Log.err('SendScreen QRCode error ' + e.message)
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </KeyboardAwareView>
                        </ScrollView>
                        :
                        <View style={styles.content}>
                            <View style={styles.top}>
                                <TouchableOpacity style={{ padding: 20 }} onPress={this.handleShare}>
                                    <Fontisto color={'#404040'} size={18} name={'share'}/>
                                </TouchableOpacity>
                                <Text style={styles.title}>
                                    {title}
                                </Text>
                                <TouchableOpacity style={{ padding: 20 }} onPress={this.handleHide}>
                                    <AntDesignIcon name='close' size={22} color='#404040'/>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.input}>
                                <View style={{ flex: 1, paddingRight: 30 }}>
                                    <Input
                                        ref={component => this.reLabelInput = component}
                                        id={'labelInput'}
                                        name={strings('send.comment')}
                                        type={'OPTIONAL'}
                                        decimals={10}
                                        isLine={false}
                                        tintColor={new UIDict(currencyCode).settings.colors.mainColor}
                                        callback={(value) => this.setState({ labelForQr: value })}/>
                                        <View style={{ width: '100%', height: 1, marginTop: -30, marginBottom: 10, backgroundColor: '#8e96b5' }} />
                                    <Input
                                        ref={component => this.refAmountInput = component}
                                        id={'amountInput'}
                                        placeholder={'0'}
                                        autoFocus={true}
                                        name={strings('exchange.mainData.amount')}
                                        type={'OPTIONAL'}
                                        keyboardType={'numeric'}
                                        additional={'NUMBER'}
                                        tapText={this.state.inputType === 'FIAT' ? basicCurrencyCode : currencySymbol}
                                        tapCallback={this.handleChangeEquivalentType}
                                        isLine={false}
                                        disabled={false}
                                        tintColor={new UIDict(currencyCode).settings.colors.mainColor}
                                        tapWrapperStyles={{ top: 15 }}
                                        // tapIconStyle={{ color: new UIDict(currencyCode).settings.colors.mainColor }}
                                        tapTextStyles={{ color: new UIDict(currencyCode).settings.colors.mainColor }}
                                        callback={(value) => this.amountInputCallback(value, true)}
                                        markStyle={{ flex: 1 }}
                                        bottomLeftText={amountInputMark}/>
                                    <View style={{ width: '100%', height: 1, marginTop: -30, marginBottom: 10, backgroundColor: '#8e96b5' }} />
                                </View>
                                <View>
                                    <QrCodeBox
                                        getRef={ref => this.refSvg = ref}
                                        size={140}
                                        logo={qrLogo}
                                        logoSize={30}
                                        value={this.createDataForQr(this.state.amountForQr, this.state.labelForQr)}
                                        onError={(e) => {
                                            Log.err('SendScreen QRCode error2 ' + e.message)
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                }
            </Modal>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore
    }
}

export default connect(mapStateToProps, {})(CustomReceiveAmountModal)

const styles = {
    content: {
        marginTop: 'auto',

        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    top: {
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',

        borderBottomColor: '#8e96b5',
        borderBottomWidth: 1,
        borderStyle: 'solid'
    },
    title: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    address: {
        marginVertical: 5,
        marginBottom: 40,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040',
        textAlign: 'center'
    },
    text: {
        marginTop: 5
    },
    qr: {
        position: 'relative',
        justifyContent: 'center',

        marginVertical: 20,
        marginLeft: SCREEN_WIDTH / 2 - 70
    },
    input: {
        flexDirection: 'row',

        marginTop: 20,
        paddingBottom: 20,

        paddingHorizontal: 20,
    },
    input__text: {
        flex: 1,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040'
    },
    keyboard: {
        paddingHorizontal: 40
    },
    keyboard__btn: {
        justifyContent: 'center',
        alignItems: 'center'

        // width: 40,
        // height: 40
    },
    keyboard__text: {
        width: 50,
        paddingVertical: 3,

        fontSize: 25,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    keyboard__row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    keyboard__item: {},
    line: {
        borderBottomColor: '#8e96b5',
        borderBottomWidth: 1,
        borderStyle: 'solid'
    }
}
