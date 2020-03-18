import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity } from 'react-native'
import firebase from 'react-native-firebase'


//import { setSelectedCrypto } from "../../../AppStores/Actions/MainStoreActions";

class CryptoListScreen extends Component {

    onPressAdd = () => {
        this.props.navigation.navigate('SelectCrypto')
    }

    handleClickCrypto = (data) => {
        this.props.setSelectedCrypto(data)
        this.props.navigation.navigate('AccountList')
    }

    render() {
        firebase.analytics().setCurrentScreen('WalletCrypto.CryptoListScreen')

        return (
            <View style={{ flex: 1, paddingLeft: 10, paddingRight: 10 }}>
                <View style={{ height: 55 }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#e6e6e6' }}>
                        <Text style={{ fontSize: 18 }}>
                            Crypto list
                        </Text>
                    </View>
                </View>
                <View>
                    {
                        this.props.selectedWallet.cryptoList.map((item, index) => {
                            return (
                                <TouchableOpacity onPress={() => this.handleClickCrypto(item)} style={{ backgroundColor: '#f2f2f2', padding: 5, margin: 5, borderRadius: 3 }} key={index}>
                                    <Text key={index}>
                                        {
                                            item.type
                                        }
                                    </Text>
                                </TouchableOpacity>
                            )
                        })
                    }
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
        //setSelectedCrypto: (data) => dispatch(setSelectedCrypto(data))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CryptoListScreen)
