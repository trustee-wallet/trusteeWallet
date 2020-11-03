/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Linking, Image, TouchableOpacity } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import { strings } from '../../services/i18n'
import GradientView from '../../components/elements/GradientView'
import { connect } from 'react-redux'
import NavStore from '../../components/navigation/NavStore'
import Icon from '../../components/elements/CustomIcon.js'
import Ionicons from 'react-native-vector-icons/Ionicons'
import config from '../../config/config'

class FioMainSettings extends Component {

    constructor(props) {
        super(props)
    }

    handleRegisterFIOAddress = async () => {
        const { accountList } = this.props.accountStore
        const { selectedWallet } = this.props.mainStore
        const { apiEndpoints } = config.fio

        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address
        if (publicFioAddress) {
            Linking.openURL(`${apiEndpoints.registrationSiteURL}${publicFioAddress}`)
        } else {
            // TODO show some warning tooltip
        }
    }

    render() {

        return (
            <View>
                <Navigation
                    title= {strings('fioMainSettings.title')}
                />

                <View style={{paddingTop: 80, height: '100%'}}>

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

                                <TouchableOpacity style={styles.block__item} onPress={() => NavStore.goNext('FioSendRequest')}>
                                    <Icon name="exchangeRates" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('fioMainSettings.sendFioRequest')}</Text>
                                        <Text style={styles.block__text__desc}>{strings('fioMainSettings.sendFioRequestDesc')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.divider}/>

                                <TouchableOpacity style={styles.block__item} onPress={() => NavStore.goNext('FioRequestsList')}>
                                    <Icon name="addressBook" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('fioMainSettings.fioRequest')}</Text>
                                        <Text style={styles.block__text__desc}>{strings('fioMainSettings.fioRequestDesc')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.divider}/>

                                <TouchableOpacity style={styles.block__item} onPress={() => NavStore.goNext('FioAddresses')}>
                                    <Icon name="settings" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('fioMainSettings.fioAddresses')}</Text>
                                        <Text style={styles.block__text__desc}>{strings('fioMainSettings.fioAddressesDesc')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.divider}/>

                                <TouchableOpacity style={styles.block__item} onPress={() => this.handleRegisterFIOAddress()}>
                                    <Icon name="info" size={20} style={styles.icon}/>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings('fioMainSettings.registerFioAddress')}</Text>
                                        <Text style={styles.block__text__desc}>{strings('fioMainSettings.registerFioAddressDesc')}</Text>
                                    </View>
                                    <View style={styles.block__item__arrow}>
                                        <Ionicons name="ios-arrow-forward" size={20} style={styles.block__arrow}/>
                                    </View>
                                </TouchableOpacity>

                            </ScrollView>
                        </View>
                    </View>

                </View>
            </View>
        );
    }
}

const mapStateToProps = (state) => ({
    mainStore: state.mainStore,
    accountStore: state.accountStore
})

export default connect(mapStateToProps, {})(FioMainSettings)

const styles_ = {
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles = {

    container: {
        paddingTop: 10,
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
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#fff',
        textAlign: 'center',
    },

    block__item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingVertical: 10,
    },

    block__item__content: {
        paddingTop: 10,
        paddingBottom: 10
    },

    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e3e6e9'
    },

    icon: {
        marginRight: 15,
        marginBottom: 1,
        color: '#b676e8',
        borderRadius: 50,
        padding: 10,
        backgroundColor: '#efefef'
    },

    block__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },

    block__text__desc: {
        marginTop: -2,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 13,
        color: '#999999',
        maxWidth: '90%'
    },

    block__item__arrow: {
        marginLeft: 'auto'
    },

    block__arrow: {
        marginLeft: 15,
        color: '#999999'
    },

}
