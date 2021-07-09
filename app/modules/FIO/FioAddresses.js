/**
 * @version 0.43
 * @author yura
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native'

import Button from '@app/components/elements/new/buttons/Button'
import i18n, { strings } from '@app/services/i18n'
import { connect } from 'react-redux'
import config from '@app/config/config'
import Moment from 'moment';
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import NavStore from '@app/components/navigation/NavStore'
import DaemonCache from '@app/daemons/DaemonCache'
import { getFioNames } from '@crypto/blockchains/fio/FioUtils'
import Netinfo from '@app/services/Netinfo/Netinfo'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

class FioAddresses extends Component {

    constructor(props) {
        super(props)
        this.state = {
            fioAddresses: []
        }
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
        const link = BlocksoftExternalSettings.getStatic('FIO_REGISTRATION_URL')
        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address
        if (publicFioAddress) {
            NavStore.goNext('WebViewScreen', { url: link + publicFioAddress, title: strings('FioAddresses.WebViewTitle') })
        } else {
            // TODO show some warning tooltip
        }
    }

    gotoFioSettings = (fioAddress) => {
        NavStore.goNext('FioSettings', { fioAddress })
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        Moment.locale(i18n.locale.split('-')[0] === 'uk' ? 'ru' : i18n.locale);
        const { colors } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('FioAddresses.title')}
            >
                <View style={styles.content2}>
                    <View style={{ paddingVertical: 20 }}>
                        <ScrollView>
                            {
                                this.state.fioAddresses.map(address => (
                                    <TouchableOpacity key={address.fio_address}
                                        onPress={() => this.gotoFioSettings(address)}>
                                        <View style={[styles.fio_item, {
                                            backgroundColor: colors.common.roundButtonContent,
                                            borderBottomColor: colors.fio.borderColorLight
                                        }]} >
                                            <Image style={[styles.fio_img, { borderColor: colors.fio.borderColorLight }]} resize={'stretch'}
                                                source={require('@assets/images/fio-logo.png')} />
                                            <Text style={[styles.fio_txt, { color: colors.common.text3 }]} >{address.fio_address}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            }
                        </ScrollView>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <Button
                            textStyle={{ textAlign: 'center' }}
                            title={strings('FioAddresses.btnText')}
                            onPress={this.handleRegisterFIOAddress}
                        />
                    </View>

                </View>

            </ScreenWrapper>
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

const styles = {
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
        fontFamily: 'Montserrat-SemiBold',
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
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 19,
        color: '#fff',
        textAlign: 'center',
    },

    txt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 19,
        color: '#777',
        textAlign: 'center',
    },

}
