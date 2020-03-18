import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, TouchableOpacity } from 'react-native'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import Icon from '../../components/elements/CustomIcon'

import NavStore from '../../components/navigation/NavStore'
import Button from '../../components/elements/Button'

import { setSelectedAccount, setSelectedCryptocurrency } from '../../appstores/Actions/MainStoreActions'

import { strings } from '../../services/i18n'


class FinishScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedCryptocurrency: {}
        }
    }

    UNSAFE_componentWillMount(){

        let currencies = JSON.parse(JSON.stringify(this.props.mainStore.currencies))

        const param = this.props.navigation.getParam('finishScreenParam')

        currencies = currencies.filter(item => item.currencyCode === param.selectedCryptocurrency.currencyCode)

        this.setState({
            selectedCryptocurrency: currencies[0]
        })
    }


    handleOrderHistory = async () => {
        NavStore.reset('ExchangeScreenStack')
    }

    handleClose = () => {
        NavStore.goNext('HomeScreenStack', null, true)
    }

    render(){
        return (
            <View style={styles.wrapper}>
                <TouchableOpacity style={styles.close} onPress={this.handleClose}>
                    <AntDesignIcon style={styles.close__icon} name='close' />
                </TouchableOpacity>
                <View style={styles.wrapper__content}>
                    <Feather style={styles.wrapper__icon} name='check-circle' />
                    <Text style={styles.wrapper__title}>
                        { strings('finishTradeScreen.title') }
                    </Text>
                    <Text style={styles.wrapper__description}>
                        { strings('finishTradeScreen.description') }
                    </Text>
                </View>
                <Button styleText={{ color: '#7127AC' }} backgroundColorArray={['#fff', '#fff']} press={this.handleOrderHistory}>
                    { strings('finishTradeScreen.orderHistoryBtn') }
                </Button>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FinishScreen)

const styles = {
    wrapper: {
        flex: 1,
        padding: 30,
        backgroundColor: '#7127AC'
    },
    wrapper__content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    wrapper__title: {
        textAlign: 'center',

        marginBottom: 16,

        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 34,
        color: '#fff'
    },
    wrapper__description: {
        textAlign: 'center',

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#fff'
    },
    wrapper__icon: {
        marginBottom: 48,

        fontSize: 128,
        color: '#fff'
    },
    close: {
        position: 'absolute',
        top: 28,
        right: 0,
        padding: 20,

        zIndex: 1
    },
    close__icon: {
        fontSize: 24,
        color: '#fff'
    }
}
