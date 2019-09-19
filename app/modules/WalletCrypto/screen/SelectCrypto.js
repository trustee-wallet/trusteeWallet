import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View,
    Text,
    TouchableOpacity
} from 'react-native';

import Navigation from "../../../components/navigation/Navigation";
import firebase from "react-native-firebase"

//import { reqInsertNewCrypto } from "../../../AppStores/Actions/MainStoreActions";

class SelectCrypto extends Component {

    componentDidUpdate(){
        //console.log(this.props.selectedWallet)
    }

    componentDidMount(){
        //console.log(this.props.selectedWallet)
    }

    handleCryptoSelect = (data) => {
        this.props.navigation.navigate('CryptoList');
        /*this.props.reqInsertNewCrypto({
            id: this.props.selectedWallet.id,
            crypto: {
                id: Math.floor(Date.now() / 1000),
                type: data.type
            }
        });*/
    };

    render() {
        firebase.analytics().setCurrentScreen('WalletCrypto.SelectCryptoScreen')

        return (
            <View style={{ flex: 1, paddingLeft: 10, paddingRight: 10}}>
                <Navigation
                    onPressBack={() => this.props.navigation.goBack(null)}
                    onPressNext={() => this.onPress()}
                    title='Select cryptocurrency'
                />
                <View style={{flex: 1,  flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{flexGrow: 1, width: '45%', height: 200}}>
                        <TouchableOpacity
                            style={{flex: 1, margin: 10, borderRadius: 10, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center', flexGrow: 1}}
                            onPress={() => {this.handleCryptoSelect({type: 'Bitcoin'})}}
                        >
                            <Text>
                                Bitcoin
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{flexGrow: 1, width: '45%', height: 200}}>
                        <TouchableOpacity
                            style={{flex: 1, margin: 10, borderRadius: 10, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center', flexGrow: 1}}
                            onPress={() => {this.handleCryptoSelect({type: 'Ethereum'})}}
                        >
                            <Text>
                                Ethereum
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{flexGrow: 1, width: '45%', height: 200}}>
                        <TouchableOpacity
                            style={{flex: 1, margin: 10, borderRadius: 10, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center', flexGrow: 1}}
                            onPress={() => {this.handleCryptoSelect({type: 'Litecoin'})}}
                        >
                            <Text>
                                Litecoin
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{flexGrow: 1, width: '45%', height: 200}}>
                        <TouchableOpacity
                            style={{flex: 1, margin: 10, borderRadius: 10, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center', flexGrow: 1}}
                            onPress={() => {this.handleCryptoSelect({type: 'Dogecoin'})}}
                        >
                            <Text>
                                Dogecoin
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        cryptoList: state.mainStore.cryptoList,
        selectedWallet: state.mainStore.selectedWallet
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        reqInsertNewCrypto: data => dispatch(reqInsertNewCrypto(data))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(SelectCrypto);
