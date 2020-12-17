/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, SafeAreaView, TouchableOpacity } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import { strings } from '../../services/i18n'
import GradientView from '../../components/elements/GradientView'
import { connect } from 'react-redux'
import NavStore from '../../components/navigation/NavStore'
import Icon from '../../components/elements/CustomIcon.js'
import Ionicons from 'react-native-vector-icons/Ionicons'
import config from '../../config/config'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/Setting'

class FioMainSettings extends Component {

    constructor(props) {
        super(props)
    }

    state = {
        headerHeight: 0,
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleRegisterFIOAddress = async () => {
        const { accountList } = this.props.accountStore
        const { selectedWallet } = this.props.mainStore
        const { apiEndpoints } = config.fio

        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address
        if (publicFioAddress) {
            NavStore.goNext('WebViewScreen', { url: `${apiEndpoints.registrationSiteURL}${publicFioAddress}`, title: strings('fioMainSettings.registerFioAddress') })
        } else {
            // TODO show some warning tooltip
        }
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    handleSendFioRequest = () => { NavStore.goNext('FioSendRequest') }

    handleFioRequests = () => { NavStore.goNext('FioRequestsList') }
    
    handleFioAddresses = () => { NavStore.goNext('FioAddresses') }

    


    render() {

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
                                <Text style={styles.titleTxt1}>{strings('fioMainSettings.description')}</Text>
                            </View>
                        </View>
                    </GradientView>

                    <View style={styles.container}>
                        <View style={{flex: 1}}>
                            <ScrollView>

                                <View style={{ paddingHorizontal: GRID_SIZE }}>
                                    <View style={{ marginVertical: GRID_SIZE }}>
                                        <ListItem
                                            title={strings('fioMainSettings.sendFioRequest')}
                                            subtitle={strings('fioMainSettings.sendFioRequestDesc')}
                                            iconType="cashMultiple"
                                            onPress={this.handleSendFioRequest}
                                            rightContent="arrow"
                                        />

                                        <ListItem
                                            title={strings('fioMainSettings.fioRequest')}
                                            subtitle={strings('fioMainSettings.fioRequestDesc')}
                                            iconType="accountBoxMultiple"
                                            onPress={this.handleFioRequests}
                                            rightContent="arrow"
                                        />

                                        <ListItem
                                            title={strings('fioMainSettings.fioAddresses')}
                                            subtitle={strings('fioMainSettings.fioAddressesDesc')}
                                            iconType="cogs"
                                            onPress={this.handleFioAddresses}
                                            rightContent="arrow"
                                        />

                                        <ListItem
                                            title={strings('fioMainSettings.registerFioAddress')}
                                            subtitle={strings('fioMainSettings.registerFioAddressDesc')}
                                            iconType="information"
                                            onPress={this.handleRegisterFIOAddress}
                                            rightContent="arrow"
                                        />

                                    </View>
                                </View>

                            </ScrollView>
                        </View>
                    </View>

                </SafeAreaView>
            </View>
        );
    }
}

const mapStateToProps = (state) => ({
    mainStore: state.mainStore,
    accountStore: state.accountStore
})

FioMainSettings.contextType = ThemeContext

export default connect(mapStateToProps, {})(FioMainSettings)

const styles_ = {
    array: ['#000000', '#222222'],
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

    titleSection: {
        padding: 10,
        color: '#fff',
    },

    titleTxt1: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 19,
        color: '#fff',
        textAlign: 'center',
    },

}
