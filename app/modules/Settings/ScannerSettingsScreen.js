/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native'

import IoniconsIcons from 'react-native-vector-icons/Ionicons'

import Navigation from '../../components/navigation/Navigation'

import NavStore from '../../components/navigation/NavStore'

import GradientView from '../../components/elements/GradientView'

import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

import { strings } from '../../services/i18n'

import firebase from 'react-native-firebase'

import config from '../../config/config'
import UpdateAccountBalanceAndTransactions from '../../daemons/back/UpdateAccountBalanceAndTransactions'

class ScannerSettingsScreen extends Component {

    getCode = () => {
        let { scannerCode } = this.props.settings.data
        if (!scannerCode) scannerCode = '1min'
        return scannerCode
    }

    setCode = async (item) => {

        await settingsActions.setSettings('scannerCode', item.code)

    }

    render() {
        firebase.analytics().setCurrentScreen('Settings.ScannerSettingsScreen')


        const { scannerSettings } = config.scanner
        const code = this.getCode()

        const time =  UpdateAccountBalanceAndTransactions.getTime()

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={strings('scannerSettings.title')}
                />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.wrapper__scrollView}>
                    <View style={styles.wrapper__content}>
                        <View style={styles.block}>
                            <View style={styles.block__content}>
                                <TouchableOpacity style={{ ...styles.block__item }}>
                                    <View style={styles.block__item__content}>
                                        <Text style={styles.block__text}>{strings(`scannerSettings.lastScan`, {time})}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            {
                                scannerSettings.map((item, index) => {
                                    return (
                                        <View style={styles.block__content} key={index}>
                                            <TouchableOpacity style={{ ...styles.block__item }} onPress={() => this.setCode(item)} key={index} disabled={item.code === code}>
                                                <View style={styles.block__item__content}>
                                                    <Text style={styles.block__text}>{strings(`scannerSettings.codes.${item.code}`)}</Text>
                                                </View>
                                                <View style={checkBox.styleBox}>
                                                    <View style={checkBox.styleBox}>
                                                        {item.code === code ? <View style={{ position: 'relative', top: Platform.OS === 'ios' ? 0 : 0 }}><IoniconsIcons name='ios-checkmark' size={30} color='#7127ac'/></View> : null}
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    )
                                })
                            }
                        </View>
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ScannerSettingsScreen)


const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const checkBox = {
    array: ['#fff', '#fff'],
    array_: ['#43156d', '#7027aa'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 },
    styleBox: {
        alignItems: 'center',

        width: 30,
        height: 30
    },
    styleGradient: {
        width: 20,
        height: 20,
        borderRadius: 4
    }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80
    },
    wrapper__top: {
        height: 145,
        marginBottom: 35
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: 35
    },
    title: {
        position: 'absolute',
        top: 75,
        width: '100%',
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#f4f4f4',
        textAlign: 'center'
    },
    block__content: {
        paddingLeft: 5,
        paddingRight: 5,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
        backgroundColor: '#fff',
        borderRadius: 40
    },
    block__title: {
        paddingLeft: 15,
        marginBottom: 5,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#7127ac'
    },
    block__item: {
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        height: 40,
        paddingLeft: 8,
        paddingRight: 8
    },
    block__item__content: {
        paddingTop: 5,
        paddingBottom: 5
    },
    block__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#404040'
    },
    block__subtext: {
        marginTop: -6,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 11,
        color: '#999999'
    },
    block__text__right: {
        marginLeft: 'auto',
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#999999'
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e3e6e9'
    },
    icon: {
        marginRight: 15,
        marginBottom: 1,
        color: '#999999'
    }
})
