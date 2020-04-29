/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'

import Skip from '../WalletBackup/elements/Skip'
import GradientView from '../../components/elements/GradientView'
import TextView from '../../components/elements/Text'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import { strings } from '../../../app/services/i18n'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import App from '../../appstores/Actions/App/App'
import Log from '../../services/Log/Log'
import firebase from 'react-native-firebase'

import { setCallback, proceedSaveGeneratedWallet } from '../../appstores/Stores/CreateWallet/CreateWalletActions'
import walletActions from '../../appstores/Stores/Wallet/WalletActions'


class BackupStep1Screen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            walletMnemonicDefault: [],
            walletMnemonicSorted: [],
            walletMnemonicSelected: [],
            status: true
        }
    }

    componentDidMount() {
        this.init()
    }

    init = () => {
        Log.log('WalletBackup.BackupStep1Screen init')

        let walletMnemonic = JSON.parse(JSON.stringify(this.props.walletMnemonic))
        walletMnemonic = walletMnemonic.split(' ')
        const walletMnemonicDefault = walletMnemonic
        let walletMnemonicSorted = JSON.parse(JSON.stringify(walletMnemonicDefault))
        walletMnemonicSorted = walletMnemonicSorted.sort(() => {
            return .5 - Math.random()
        })

        this.setState({
            walletMnemonicDefault: walletMnemonicDefault,
            walletMnemonicSorted: walletMnemonicSorted,
            walletMnemonicSelected: []
        })
    }

    handleSelectWord = (item, index) => {
        const walletMnemonicSorted = JSON.parse(JSON.stringify(this.state.walletMnemonicSorted))
        const walletMnemonicSelected = JSON.parse(JSON.stringify(this.state.walletMnemonicSelected))
        walletMnemonicSelected.push(item)

        walletMnemonicSorted.splice(index, 1)

        this.setState({
            walletMnemonicSelected,
            walletMnemonicSorted
        }, () => {
            this.validateMnemonic()
        })
    }

    handleRemoveWord = (item, index) => {
        const walletMnemonicSelected = JSON.parse(JSON.stringify(this.state.walletMnemonicSelected))
        const walletMnemonicSorted = JSON.parse(JSON.stringify(this.state.walletMnemonicSorted))
        walletMnemonicSorted.push(item)

        walletMnemonicSelected.splice(index, 1)

        this.setState({
            walletMnemonicSelected,
            walletMnemonicSorted
        })
    }

    handleSkip = () => {
        const { settingsStore }  = this.props

        if(+settingsStore.lock_screen_status) {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.disabledSkipModal.description')
            })
            return
        }

        showModal({ type: 'BACKUP_SKIP_MODAL' })
    }

    validateMnemonic = async () => {

        const { flowType } = this.props.createWalletStore

        if (this.state.walletMnemonicSorted.length) return true

        if (JSON.stringify(this.state.walletMnemonicSelected) !== JSON.stringify(this.state.walletMnemonicDefault)) {
            showModal({ type: 'MNEMONIC_FAIL_MODAL' }, this.init)
        } else if (flowType === 'BACKUP_WALLET') {

            walletActions.setWalletBackedUpStatus(this.props.mainStore.selectedWallet.walletHash)

            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.walletBackup.success'),
                description: strings('modal.walletBackup.seedConfirm')
            }, () => {
                NavStore.reset('DashboardStack')
            })
        } else {
            const { walletName, walletMnemonic, callback } = this.props.createWalletStore

            try {
                setLoaderStatus(true)

                let tmpWalletName = walletName

                if(!tmpWalletName) {
                    tmpWalletName = await walletActions.getNewWalletName()
                }

                const storedKey = await proceedSaveGeneratedWallet({
                    walletName: tmpWalletName,
                    walletMnemonic
                })

                walletActions.setWalletBackedUpStatus(storedKey)

                setLoaderStatus(false)

                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.walletBackup.success'),
                    description: strings('modal.walletBackup.walletCreated')
                }, async () => {
                    if (callback === null) {
                        NavStore.reset('DashboardStack')
                        await App.refreshWalletsStore()
                    } else {
                        callback()
                        setCallback({ callback: null })
                    }
                })
            } catch (e) {
                Log.err('WalletBackup.BackupStep1Screen.validateMnemonic error ' + e.message)
            }

        }

    }

    render() {
        firebase.analytics().setCurrentScreen('WalletBackup.BackupStep1Screen')

        const { flowType } = this.props.createWalletStore

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                {
                    flowType === 'BACKUP_WALLET' ?
                        <Navigation
                            title={strings('walletBackup.title')}
                            isClose={false}
                        /> :
                        <Navigation
                            title={strings('walletBackup.titleNewWallet')}
                            nextTitle={strings('walletBackup.skip')}
                            next={this.handleSkip}
                        />
                }
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.wrapper__content}
                    style={styles.wrapper__scrollView}>
                    <TextView style={{ height: 90 }}>
                        {strings('walletBackup.secondStep.description')}
                    </TextView>
                    <View style={styles.confirm}>
                        <View style={[styles.confirm__content, { height: this.state.walletMnemonicDefault.length > 12 ? 230 : 150 }]}>
                            {
                                this.state.walletMnemonicSelected.map((item, index) => {
                                    console.log(this.state.walletMnemonicSelected.length)
                                    return (
                                        <TouchableOpacity onPress={() => this.handleRemoveWord(item, index)} key={index}>
                                            <GradientView style={styles.confirm__item} array={stylesSeedItem.array}
                                                          start={stylesSeedItem.start} end={stylesSeedItem.end}>
                                                <Text style={styles.confirm__item__text} key={index}>
                                                    {item}
                                                </Text>
                                            </GradientView>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </View>
                        <View style={styles.content__bg}></View>
                    </View>
                    <View style={styles.seed}>
                        {
                            this.state.walletMnemonicSorted.map((item, index) => {
                                return (
                                    <TouchableOpacity style={styles.seed__item}
                                                      onPress={() => this.handleSelectWord(item, index)} key={index}>
                                        <GradientView style={styles.seed__item__gradient} array={stylesSeedItem.array}
                                                      start={stylesSeedItem.start} end={stylesSeedItem.end}>
                                            <Text style={styles.confirm__item__text}>{item}</Text>
                                        </GradientView>
                                    </TouchableOpacity>
                                )
                            })
                        }
                    </View>
                </ScrollView>
                <Skip/>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        settingsStore: state.settingsStore.data,
        createWalletStore: state.createWalletStore,
        walletMnemonic: state.createWalletStore.walletMnemonic
    }
}

export default connect(mapStateToProps, {})(BackupStep1Screen)

const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const stylesSeedItem = {
    array: ['#7026ab', '#44156d'],
    start: { x: 0.0, y: 1 },
    end: { x: 1, y: 1 }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80
    },
    wrapper__content: {
        marginTop: 20,
        paddingLeft: 15,
        paddingRight: 15
    },
    title: {
        marginBottom: 10,
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    text: {
        marginBottom: 50,
        paddingLeft: 15,
        paddingRight: 15,
        textAlign: 'justify',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    seed: {
        marginBottom: 10,
        marginTop: 40,
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    seed__item: {
        borderRadius: 8,
    },
    seed__item__gradient: {
        marginVertical: 8,
        marginHorizontal: 8,

        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    seed__item__text: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e3e6e9',
        fontSize: 12
    },
    content: {
        position: 'relative'
    },
    confirm__content: {
        position: 'relative',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'center',
        height: 230,
        padding: 20,
        borderColor: '#864dd9',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderRadius: 10,
        zIndex: 2
    },
    content__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#f9f9f9',
        zIndex: 1,
        borderRadius: 10
    },
    confirm__item: {
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        marginBottom: 10,
        marginRight: 10,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 12,
        color: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    confirm__item__text: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e3e6e9',
        fontSize: 12
    },
    btn: {
        marginBottom: 50
    }
})
