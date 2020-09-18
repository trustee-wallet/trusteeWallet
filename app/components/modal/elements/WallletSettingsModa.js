/**
 * @version 0.9
 * @misha - is it actually used? seems not translated
 */
import React, { Component } from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Button from '../../../components/elements/modal/Button'
import Input from '../../../components/elements/Input'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../../services/i18n'
import { setMnemonicLength, setWalletName } from '../../../appstores/Stores/CreateWallet/CreateWalletActions'


class WalletSettingsModal extends Component {

    constructor(props) {
        super(props)
        this.state = {
            oldMnemonicLength: 0,
            mnemonicLength: 0
        }
    }

    componentDidMount() {

        const { createWalletStore } = this.props

        this.walletNameInput.handleInput(createWalletStore.walletName)

        this.setState({
            oldMnemonicLength: createWalletStore.mnemonicLength,
            mnemonicLength: createWalletStore.mnemonicLength
        })
    }

    handleHide = () => {
        hideModal()
    }

    handleSubmit = async () => {

        const { mnemonicLength } = this.state

        const { createWalletStore, callback } = this.props

        const res = await this.walletNameInput.handleValidate()

        if(res.status === 'success') {
            setWalletName({ walletName: res.value })
            if(createWalletStore.flowType === 'CREATE_NEW_WALLET') {
                if(this.state.oldMnemonicLength !== this.state.mnemonicLength) {
                    setMnemonicLength({mnemonicLength})
                    callback()
                }
            }
        }

        hideModal()
    }

    handleSelectMnemonicLength = (mnemonicLength) => {
        this.setState({
            mnemonicLength
        })
    }

    render() {

        const { mnemonicLength } = this.state
        const { show, createWalletStore } = this.props
        const { title } = this.props.data

        return (
            <Layout visible={show}>
                <View>
                    <Title style={styles.title}>
                        { title }
                    </Title>
                    <View style={{paddingHorizontal: 20, height: 70}}>
                        <Input
                            ref={ref => this.walletNameInput = ref}
                            id={'walletName'}
                            name={strings('walletCreate.name') + " (" + strings('walletCreate.optional') + ")"}
                            type={'OPTIONAL'}
                        />
                    </View>
                    {
                        createWalletStore.flowType === 'CREATE_NEW_WALLET' ?
                            <View style={styles.mnemonicLength}>
                                <Text style={styles.mnemonicLength__title}>
                                    {strings('walletCreate.description')}
                                </Text>
                                <View style={styles.mnemonicLength__content}>
                                    <TouchableOpacity
                                        style={styles.mnemonicLength__item}
                                        disabled={mnemonicLength === 128}
                                        onPress={() => this.handleSelectMnemonicLength(128)}>
                                        <View style={styles.radio}>
                                            <View style={mnemonicLength === 128 ? styles.radio__dot : null}/>
                                        </View>
                                        <Text>{12 + ' ' + strings('walletCreate.words12')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.mnemonicLength__item}
                                        disabled={mnemonicLength === 256}
                                        onPress={() => this.handleSelectMnemonicLength(256)}>
                                        <View style={styles.radio}>
                                            <View style={mnemonicLength === 256 ? styles.radio__dot : null}/>
                                        </View>
                                        <Text>{24 + ' ' + strings('walletCreate.words24')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View> : null
                    }
                    <View style={{marginBottom: 12 }}>
                        <Button onPress={() => this.handleHide()} color={'#864DD9'} shadow={true}>
                            {strings('walletBackup.skipElement.cancel')}
                        </Button>
                        <Button onPress={() => this.handleSubmit()} style={{ backgroundColor: 'none', color: '#864DD9' }}>
                            {strings('walletCreate.submit')}
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        createWalletStore: state.createWalletStore
    }
}

export default connect(mapStateToProps, {})(WalletSettingsModal)

const styles = {
    title: {
        marginTop: 25
    },
    text: {
        marginTop: 5
    },
    content: {
        alignItems: 'flex-start',
        paddingHorizontal: 20
    },
    mnemonicLength: {
        alignItems: 'flex-start',
        paddingHorizontal: 20
    },
    mnemonicLength__title: {
        marginTop: 10,
        padding: 0,
        margin: 0,

        color: '#7127ac',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular'
    },
    mnemonicLength__content: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    mnemonicLength__item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',

        paddingVertical: 10,
        marginRight: 20
    },
    radio: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#6B36A8',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    }
}
