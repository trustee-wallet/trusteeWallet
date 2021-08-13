/**
 * @version 0.43
 * @author yura
 */
import React, { Component } from 'react'
import { View, Text, ScrollView } from 'react-native'

import { strings } from '@app/services/i18n'
import GradientView from '@app/components/elements/GradientView'
import { connect } from 'react-redux'
import NavStore from '@app/components/navigation/NavStore'
import config from '@app/config/config'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

class FioMainSettings extends Component {

    handleRegisterFIOAddress = async () => {
        const { accountList } = this.props.accountStore
        const { selectedWallet } = this.props.mainStore
        const link = BlocksoftExternalSettings.getStatic('FIO_REGISTRATION_URL')
        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address
        if (publicFioAddress) {
            NavStore.goNext('WebViewScreen', { url: link + publicFioAddress, title: strings('fioMainSettings.registerFioAddress') })
        } else {
            // TODO show some warning tooltip
        }
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    handleSendFioRequest = () => { NavStore.goNext('FioSendRequest') }

    handleFioRequests = () => { NavStore.goNext('FioRequestsList') }

    handleFioAddresses = () => { NavStore.goNext('FioAddresses') }




    render() {

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('fioMainSettings.title')}
            >
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
                    <View style={{ flex: 1 }}>
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

            </ScreenWrapper>
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
    array: ['#222', '#222'],
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
