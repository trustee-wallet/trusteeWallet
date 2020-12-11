/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, SafeAreaView, TouchableOpacity } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/new/buttons/Button'
import { strings } from '../../services/i18n'
import GradientView from '../../components/elements/GradientView'
import { connect } from 'react-redux'
import config from '../../config/config'
import Moment from 'moment';
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import NavStore from '../../components/navigation/NavStore'
import DaemonCache from '../../daemons/DaemonCache'
import { getFioNames } from '../../../crypto/blockchains/fio/FioUtils'
import Netinfo from '../../services/Netinfo/Netinfo'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'

class FioAddresses extends Component {

    constructor(props) {
        super(props)
        this.state = {
            fioAddresses: [],
            headerHeight: 0,
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    async componentDidMount() {
        setLoaderStatus(true)
        try {
            await Netinfo.isInternetReachable()
            await this.resolveFioAccount()
        } catch (e) {
            NavStore.goBack(null)
        } finally {
            setLoaderStatus(false)
        }
    }

    resolveFioAccount = async () => {
        const { selectedWallet } = this.props.mainStore
        const fioAccount = await DaemonCache.getCacheAccount(selectedWallet.walletHash, 'FIO')
        if (fioAccount && fioAccount.address) {
            const fioNames = await getFioNames(fioAccount.address)
            if (fioNames && fioNames.length > 0) {
                this.setState({
                    fioAddresses: fioNames,
                })
            }
        }
    }

    handleRegisterFIOAddress = async () => {
        const { accountList } = this.props.accountStore
        const { selectedWallet } = this.props.mainStore
        const { apiEndpoints } = config.fio

        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address
        if (publicFioAddress) {
            NavStore.goNext('WebViewScreen', { url: `${apiEndpoints.registrationSiteURL}${publicFioAddress}`, title: strings('FioAddresses.btnText') })
        } else {
            // TODO show some warning tooltip
        }
    }

    gotoFioSettings = (fioAddress) => {
        NavStore.goNext('FioSettings', { fioAddress })
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    render() {
        Moment.locale('en');
        const { colors, GRID_SIZE } = this.context
        const { headerHeight } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('fioMainSettings.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />

                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                    height: '100%',
                }]}>

                    <GradientView
                        array={styles_.array}
                        start={styles_.start} end={styles_.end}>
                        <View style={styles.titleSection}>
                            <View>
                                <Text style={styles.titleTxt1}>{strings('FioAddresses.description')}</Text>
                            </View>
                        </View>
                    </GradientView>

                    <View style={styles.content2}>

                        <View style={{ paddingVertical: 20}}>
                            <ScrollView>
                                {
                                    this.state.fioAddresses.map(address => (
                                        <TouchableOpacity key={address.fio_address}
                                                          onPress={() => this.gotoFioSettings(address)}>
                                            <View style={[styles.fio_item, {
                                                backgroundColor: colors.common.roundButtonContent,
                                                borderBottomColor: colors.fio.borderColorLight
                                            }]} >
                                                <Image  style={[styles.fio_img, { borderColor: colors.fio.borderColorLight }]}   resize={'stretch'}
                                                       source={require('../../assets/images/fio-logo.png')}/>
                                                <Text style={[styles.fio_txt, { color: colors.common.text3 }]} >{address.fio_address}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                }
                            </ScrollView>
                        </View>

                        <View style={{marginTop: 20}}>
                            <Button
                                title={strings('FioAddresses.btnText')}
                                onPress={this.handleRegisterFIOAddress}
                            />
                        </View>

                    </View>

                </SafeAreaView>
            </View>
        );
    }
}

const mapStateToProps = (state) => ({
    mainStore: state.mainStore,
    accountStore: state.accountStore,
    currencyStore: state.currencyStore
})

FioAddresses.contextType = ThemeContext

export default connect(mapStateToProps, {})(FioAddresses)

const styles_ = {
    array: ['#000000', '#333333'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles = {

    container: {
        paddingTop: 0,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between'
    },

    content: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between'
    },

    content2: {
        padding: 30,
        paddingTop: 5,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between'
    },

    titleSection: {
        padding: 10,
        color: '#fff',
    },

    txtCenter: {
        textAlign: 'center',
    },

    fio_item: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderRadius: 20
    },

    fio_txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
    },

    fio_img: {
        width: 25,
        height: 25,
        marginRight: 20,
        borderWidth: 1,
        padding: 20,
        borderRadius: 100
    },

    titleTxt1: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#fff',
        textAlign: 'center',
    },

    txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#777',
        textAlign: 'center',
    },

}
