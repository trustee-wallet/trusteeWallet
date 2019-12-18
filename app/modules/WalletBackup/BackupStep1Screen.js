/**
 * @version 0.2
 */
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {View, Text, TouchableOpacity, StyleSheet, Button, ScrollView} from 'react-native'

import Skip from '../WalletBackup/elements/Skip'
import GradientView from '../../components/elements/GradientView'
import TextView from '../../components/elements/Text'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import {strings} from 'root/app/services/i18n'

import {showModal} from '../../appstores/Actions/ModalActions'
import { setLoaderStatus, proceedSaveGeneratedWallet } from '../../appstores/Actions/MainStoreActions'

import App from "../../appstores/Actions/App/App"
import Log from '../../services/Log/Log'
import firebase from "react-native-firebase"
import { setCallback } from '../../appstores/Actions/CreateWalletActions'
import settingsActions from '../../appstores/Actions/SettingsActions'
import walletActions from '../../appstores/Actions/WalletActions'

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
        let walletMnemonicDefault = walletMnemonic.slice(0, 7)
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
        let walletMnemonicSorted = JSON.parse(JSON.stringify(this.state.walletMnemonicSorted))
        let walletMnemonicSelected = JSON.parse(JSON.stringify(this.state.walletMnemonicSelected))
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
        let walletMnemonicSelected = JSON.parse(JSON.stringify(this.state.walletMnemonicSelected))
        let walletMnemonicSorted = JSON.parse(JSON.stringify(this.state.walletMnemonicSorted))
        walletMnemonicSorted.push(item)

        walletMnemonicSelected.splice(index, 1)

        this.setState({
            walletMnemonicSelected,
            walletMnemonicSorted
        })
    }

    handleSkip = () => {
        showModal({type: 'BACKUP_SKIP_MODAL'})
    }

    validateMnemonic = async () => {

        const { flowType } = this.props.createWalletStore

        if (this.state.walletMnemonicSorted.length) return true

        if (JSON.stringify(this.state.walletMnemonicSelected) !== JSON.stringify(this.state.walletMnemonicDefault)) {
            showModal({type: 'MNEMONIC_FAIL_MODAL'}, this.init)
        } else if (flowType === 'BACKUP_WALLET') {

            walletActions.setWalletBackedUpStatus(this.props.mainStore.selectedWallet.wallet_hash, 1)

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

                const storedKey = await proceedSaveGeneratedWallet({
                    walletName,
                    walletMnemonic
                })

                walletActions.setWalletBackedUpStatus(storedKey, 1)

                setLoaderStatus(false)

                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.walletBackup.success'),
                    description: strings('modal.walletBackup.walletCreated')
                }, async () => {
                    if(callback === null){
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

    onPress = () => {


        // this.props.navigation.navigate('HomeScreen');

        let reqData = {
            id: Math.floor(Date.now() / 1000),
            // mnemonic: this.props.navigation.getParam('mnemonicArray').join(' '),
            walletName: this.props.navigation.getParam('walletName')
        }

        // this.props.reqInsertNewWallet(reqData);

        /*
        queryMnemonicSchema().then((res) => {
            console.log(res)
        }).catch((error) => {
            console.log('Ne vishlo')
        });
        */

    }

    render() {
        firebase.analytics().setCurrentScreen('WalletBackup.BackupStep1Screen')

        const {flowType} = this.props.createWalletStore

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
                    <TextView style={{height: 90}}>
                        {strings('walletBackup.secondStep.description')}
                    </TextView>
                    <View style={styles.confirm}>
                        <View style={styles.confirm__content}>
                            {
                                this.state.walletMnemonicSelected.map((item, index) => {
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
        createWalletStore: state.createWalletStore,
        walletMnemonic: state.createWalletStore.walletMnemonic
    }
}

export default connect(mapStateToProps, {})(BackupStep1Screen)

const styles_ = {
    array: ['#fff', '#F8FCFF'],
    start: {x: 0.0, y: 0},
    end: {x: 0, y: 1}
}

const stylesSeedItem = {
    array: ['#7026ab', '#44156d'],
    start: {x: 0.0, y: 1},
    end: {x: 1, y: 1}
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80,
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
        marginTop: 70,
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    seed__item: {
        marginBottom: 10,
        marginRight: 10,

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
    seed__item__gradient: {
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 8
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
        height: 140,
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
        backgroundColor: '#F6F8F9',
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
