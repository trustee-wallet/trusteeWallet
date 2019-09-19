/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { StyleSheet, View, Image, ScrollView } from 'react-native'

import Button from '../../components/elements/Button'
import ButtonLine from '../../components/elements/ButtonLine'
import GradientView from '../../components/elements/GradientView'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import { setFlowType } from '../../appstores/Actions/CreateWalletActions'

import Log from '../../services/Log/Log'
import firebase from "react-native-firebase"

class WalletCreateScreen extends Component {

    componentDidMount() {
        Log.log('WalletCreateScreen is mounted')
    }

    handleSelect = (data) => {
        setFlowType(data)
        NavStore.goNext('EnterNameScreen')
    }

    handleCreate = () => {
        this.handleSelect({
            flowType: 'CREATE_NEW_WALLET'
        })
    }

    handleImport = () => {
        this.handleSelect({
            flowType: 'IMPORT_WALLET'
        })
    }

    render() {
        firebase.analytics().setCurrentScreen('WalletCreate.WalletCreateScreen')

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation/>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.wrapper__content}
                    style={styles.wrapper__scrollView}>
                    <View style={styles.item}>
                        <Image
                            style={styles.createImg}
                            resizeMode='stretch'
                            source={require('../../assets/images/createMain.png')}
                        />
                        <Button press={this.handleCreate} styles={styles.button}>
                            Create wallet
                        </Button>
                    </View>
                    <View style={styles.item}>
                        <Image
                            style={styles.importImg}
                            resizeMode='stretch'
                            source={require('../../assets/images/importMain.png')}
                        />
                        <ButtonLine press={this.handleImport} styles={styles.button}>
                            Import wallet
                        </ButtonLine>
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

export default WalletCreateScreen

const styles_ = {
    array: ['#fff', '#F8FCFF'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    wrapper__content: {
        justifyContent: 'center',
        padding: 30
    },
    item: {
        alignItems: 'center',
        width: '100%'
    },
    createImg: {
        width: 210,
        height: 210,
        marginBottom: 20
    },
    importImg: {
        width: 125,
        height: 180,
        marginTop: 20,
        marginBottom: 20
    },
    button: {
        width: '100%'
    }
})
