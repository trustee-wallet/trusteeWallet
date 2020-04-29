/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, Text, Keyboard } from 'react-native'

import firebase from 'react-native-firebase'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import Input from '../../components/elements/Input'
import Button from '../../components/elements/Button'

import customCurrencyActions from '../../appstores/Actions/CustomCurrencyActions'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import { strings } from '../../services/i18n'

import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import Log from '../../services/Log/Log'


class AddCustomTokenScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            tokenType: ''
        }
    }

    addToken = async () => {

        let addressInputValidate = { status: false }
        try {
            addressInputValidate = await this.addressInput.handleValidate()
        } catch (e) {
            Log.log('AddCustomTokenScreen.addToken error validation ' + e.message)
        }
        if (addressInputValidate.status !== 'success') return

        const tokenAddress = addressInputValidate.value
        Keyboard.dismiss()
        const tokenType = tokenAddress.substr(0, 2) === '0x' ? 'ETH_ERC_20' : 'TRX' // more logic - into validation of input is enough

        Log.log('AddCustomTokenScreen.addToken start adding ' + tokenAddress + ' ' + tokenType)

        setLoaderStatus(true)

        let checked
        try {
            checked = await customCurrencyActions.checkCustomCurrency({
                tokenType,
                tokenAddress
            })

            Log.log('AddCustomTokenScreen.addToken checked ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked))

            if (!checked) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.infoAddCustomAssetModal.error.title'),
                    description: strings('modal.infoAddCustomAssetModal.error.description')
                })

                setLoaderStatus(false)

                return
            }


        } catch (e) {

            Log.log('AddCustomTokenScreen.addToken checked' + tokenAddress + ' ' + tokenType + ' error ' + e.message)

            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.infoAddCustomAssetModal.catch.title'),
                description: strings('modal.infoAddCustomAssetModal.catch.description')
            })

            setLoaderStatus(false)

            return
        }


        if (BlocksoftDict.Currencies['CUSTOM_' + checked.currencyCode]) {

            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.infoAddCustomAssetModal.attention.title'),
                description: strings('modal.infoAddCustomAssetModal.attention.description')
            })

            setLoaderStatus(false)

            return
        }

        // @misha - i think here some info window to confirm add could be added
        await customCurrencyActions.addCustomCurrency({
            currencyCode: checked.currencyCode,
            currencyName: checked.currencyName,
            tokenType: checked.tokenType,
            tokenAddress: checked.tokenAddress,
            tokenDecimals: checked.tokenDecimals
        })

        await customCurrencyActions.importCustomCurrenciesToDict()

        setLoaderStatus(false)

        showModal({
            type: 'INFO_MODAL',
            icon: true,
            title: strings('modal.infoAddCustomAssetModal.success.title'),
            description: strings('modal.infoAddCustomAssetModal.success.description')
        }, () => {
            NavStore.goBack()
        })

    }

    render() {
        firebase.analytics().setCurrentScreen('AddCustomToken.index')

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('AddCustomToken.mainTitle')}
                />
                <KeyboardAwareView>
                    <View style={{ flex: 1 }}>
                        <View style={styles.wrapper__content}>
                            {/* <View style={styles.selectType}> */}
                            {/*    <TouchableOpacity style={styles.selectType__item}> */}
                            {/*        <CustomIcon name="ETH" style={styles.selectType__item__icon} /> */}
                            {/*        <Text style={styles.selectType__item__text}>Ethereum</Text> */}
                            {/*    </TouchableOpacity > */}
                            {/*    <View style={{ width: 10 }} /> */}
                            {/*    <TouchableOpacity style={styles.selectType__item}> */}
                            {/*        <CustomIcon name="TRX" style={styles.selectType__item__icon} /> */}
                            {/*        <Text style={styles.selectType__item__text}>Tron</Text> */}
                            {/*    </TouchableOpacity> */}
                            {/* </View> */}
                            <View>
                                <Text style={styles.text}>
                                    {strings('AddCustomToken.description')}
                                </Text>
                                <Input
                                    ref={ref => this.addressInput = ref}
                                    id={'address'}
                                    name={strings('AddCustomToken.tokenInputTitle')}
                                    type={['ETH_ADDRESS', 'TRX_ADDRESS', 'TRX_TOKEN']}
                                    validPlaceholder={true}
                                    paste={true}
                                />
                            </View>
                        </View>
                    </View>
                    <View style={{ paddingHorizontal: 15, marginBottom: 50 }}>
                        <Button styles={styles.btn} press={this.addToken}>
                            {strings('AddCustomToken.add')}
                        </Button>
                    </View>
                </KeyboardAwareView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore
    }
}

export default connect(mapStateToProps, {})(AddCustomTokenScreen)


const styles = {
    wrapper: {
        flex: 1,

        backgroundColor: '#f9f9f9'
    },
    wrapper__content: {
        flex: 1,

        paddingRight: 15,
        paddingLeft: 15,
        marginTop: 110
    },
    selectType: {
        flexDirection: 'row',
        marginBottom: 20
    },
    selectType__item: {
        flex: 1,

        flexDirection: 'row',
        alignItems: 'center',

        height: 44,
        paddingHorizontal: 15,

        backgroundColor: '#fff',
        borderRadius: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    selectType__item__icon: {
        marginRight: 10,

        fontSize: 19,
        color: '#7127AC'
    },
    selectType__item__text: {
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#7127AC'
    },
    text: {
        marginBottom: 5,

        fontSize: 16,
        color: '#999999',
        fontFamily: 'SFUIDisplay-Regular'
    }
}
