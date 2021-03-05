/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
    Keyboard,
    Dimensions,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Switch
} from 'react-native'

import Input from '../../components/elements/Input'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '../../appstores/Stores/Main/MainStoreActions'

import { strings } from '../../services/i18n'

import Log from '../../services/Log/Log'
import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'
import Database from '@app/appstores/DataSource/Database';
import LetterSpacing from '../../components/elements/LetterSpacing'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'
import Navigation from '../../components/navigation/Navigation'
import NavStore from '../../components/navigation/NavStore'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '../../services/UI/Toast/Toast'
import GradientView from '../../components/elements/GradientView'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

class EnterHashToFind extends Component {

    constructor(props) {
        super(props)
        this.state = {
            show: false,
            addresses : []
        }
        this.hashToFindInput = React.createRef()
    }

    handleFind = async () => {
        const result = await this.hashToFindInput.handleValidate()

        if (result.status !== 'success') {
            return false
        }

        try {

            Keyboard.dismiss()

            setLoaderStatus(true)

            const walletHash = await cryptoWalletsDS.getSelectedWallet()

            const sql = `SELECT account.wallet_hash AS walletHash, account.currency_code AS currencyCode, account.address, account.derivation_path as derivationPath
            FROM account
            WHERE wallet_hash='${walletHash}'
            ORDER BY account.id
        `
            const res = await Database.setQueryString(sql).query()

            const unique = {}
            const addresses = []
            for (const row of res.array) {
                if (typeof unique[row.currencyCode] !== 'undefined') {
                    continue
                }
                let hash = result.value
                if (!hash || hash === '') {
                    hash = row.walletHash
                }
                const key = await cryptoWalletsDS.getOneWalletText(hash, row.derivationPath, row.currencyCode)
                unique[row.currencyCode] = key
                if (typeof key !== 'undefined' && key && typeof unique[key.address] === 'undefined') {
                    key.currencyCode = row.currencyCode
                    addresses.push(key)
                }
                unique[key.address] = 1
            }

            setLoaderStatus(false)

            if (addresses.length > 0) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: 'FOUND RESULT',
                    description: 'SEE KEYS BELOW'
                })

                this.setState({
                    addresses,
                    show: true
                })
            } else {
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.send.fail'),
                    description: 'NO KEYS FOUND'
                })
            }


        } catch (e) {
            Log.err('WalletCreate.EnterHashToFind error ' + e.message)

            setLoaderStatus(false)

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.send.fail'),
                description: e.message
            })

        }
    }

    handleCopy = (address) => {
        copyToClipboard(address)
        Toast.setMessage(strings('toast.copied')).show()
    }

    render() {

        const { account, containerStyle, mainStore } = this.props
        const { show, addresses } = this.state

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={'FIND KEYS'}
                    isBack={true}
                    closeAction={() => NavStore.goBack()}
                />
                <View style={[styles.settings, containerStyle]}>
                    <View style={styles.settings__row}>
                        <Text style={styles.settings__main__title}>{'Contact support to get your public hash'}</Text>
                    </View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5, paddingTop: 30 }}>
                                <Input
                                    ref={ref => this.hashToFindInput = ref}
                                    id={'hashToFind'}
                                    type={'string'}
                                    name={'HASH (for example, cac554d7ee9067bb3471607a1afe32b6)'}
                                    paste={true}
                                />
                            </View>
                        </View>
                    </View>
                    <View style={styles.settings__row}>
                        <View style={styles.settings__content}>
                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 15 }}>
                                <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleFind}>
                                    <LetterSpacing text={'FIND'}
                                                   textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                                   numberOfLines={1} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>


                    {
                        show ?
                            addresses.map((item, index) => {

                                    const address = item.address
                                    const addressPrep = BlocksoftPrettyStrings.makeCut(address, 10, 8)
                                    const addressPriv = BlocksoftPrettyStrings.makeCut(item.privateKey, 10, 8)
                                    return <View style={styles.settings__row} key={index}>
                                        <View style={styles.settings__content}>
                                            <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                                                <LetterSpacing text={item.currencyCode}
                                                               textStyle={{ ...styles.settings__title }}
                                                               letterSpacing={0.5}
                                                               numberOfLines={2} />
                                            </View>
                                            <View style={{ flex: 2, paddingLeft: 5, paddingRight: 5 }}>
                                                <TouchableOpacity onPress={() => this.handleCopy(item.address)}>
                                                <LetterSpacing text={addressPrep}
                                                               textStyle={{ ...styles.settings__title }}
                                                               letterSpacing={0.5}
                                                               numberOfLines={2} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ flex: 2, paddingLeft: 5, paddingRight: 15 }}>
                                                <TouchableOpacity onPress={() => this.handleCopy(item.privateKey)}>
                                                <LetterSpacing text={addressPriv}
                                                               textStyle={{ ...styles.settings__title }}
                                                               letterSpacing={0.5}
                                                               numberOfLines={2} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                            })
                            : null
                    }
                </View>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(EnterHashToFind)

const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = {
    settings: {
        position: 'relative',
        justifyContent: 'space-between',
        alignContent: 'flex-end',

        marginBottom: 100,
        marginTop: 120,

        borderRadius: 16,

        zIndex: 2
    },
    settings__main__title: {
        marginLeft: 15,
        marginBottom: 10,
        marginTop: -8,
        color: '#404040',
        fontSize: 16,
        fontFamily: 'Montserrat-Bold'
    },
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        color: '#404040'
    },
    settings__row: {

        paddingHorizontal: 16,
        paddingTop: 8
    },
    settings__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    settings__close: {
        position: 'absolute',
        top: 24,
        right: 0,

        padding: 15
    },
    settings__close__icon: {
        fontSize: 24,
        color: '#864DD9'
    },
    settings__line: {
        height: 1
    },
    settings__line__item: {
        height: '100%',
        backgroundColor: '#000'
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
        borderColor: '#404040',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    },
    btn: {
        alignItems: 'center',

        padding: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,

        backgroundColor: '#fff',
        borderRadius: 10
    },
    btn__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9'
    }
}
