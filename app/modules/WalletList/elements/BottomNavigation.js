import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Image, Vibration, Platform } from 'react-native'

import DeviceInfo from 'react-native-device-info'

import EntypoItem from 'react-native-vector-icons/Entypo'
import IconAwesome from 'react-native-vector-icons/FontAwesome'
import FontistoIcon from 'react-native-vector-icons/Fontisto'
import CustomIcon from '../../../components/elements/CustomIcon'

import NavStore from '../../../components/navigation/NavStore'
import ToolTips from '../../../components/elements/ToolTips'

import { setExchangeType } from '../../../appstores/Actions/ExchangeStorage'

import { strings } from '../../../services/i18n'
import { showModal } from '../../../appstores/Actions/ModalActions'
import Toast from '../../../services/Toast/Toast'
import ToolTipsActions from '../../../appstores/Actions/ToolTipsActions'
import ExchangeActions from '../../../appstores/Actions/ExchangeActions'
import settingsActions from '../../../appstores/Actions/SettingsActions'

const deviceModel = DeviceInfo.getModel()

class BottomNavigation extends Component {

    constructor(){
        super()
        this.state = {
            btnType: 'BUY',
            tips: true
        }
        this.buySellBtnTooltip = React.createRef()
    }

    handleModal = () => {
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.settings.soon'),
            description: strings('modal.settings.soonDescription')
        })
    }

    handleMainBtn = () => {

        settingsActions.setSettings('tool_tips_state', 0)

        this.buySellBtnTooltip.hideTooltip()
        ToolTipsActions.setToolTipState('HOME_SCREEN_BUY_SELL_BTN_TIP')

        ExchangeActions.getExchangeStatus((res) => {
            setExchangeType({ exchangeType: this.state.btnType === 'BUY' ? 'BUY' : 'SELL' })
            NavStore.goNext('ExchangeScreenStack', {
                exchangeApiConfig: res
            })
        })
    }

    handleSettings = () => {
        NavStore.goNext('SettingsScreenStack')
    }

    handleChangeBtn = () => {

        Vibration.vibrate(100)

        const toastMsg = this.state.btnType === 'BUY' ? strings('dashboardStack.buy') + ' ' + String.fromCodePoint(parseInt('279c', 16)) + ' ' + strings('dashboardStack.sell') : strings('dashboardStack.sell') + ' ' + String.fromCodePoint(parseInt('279c', 16)) + ' ' + strings('dashboardStack.buy')

        Toast.setMessage(toastMsg).show(-200)

        this.setState({
            btnType: this.state.btnType === 'BUY' ? 'SELL' : 'BUY'
        })
    }

    render() {

        const { btnType } = this.state


        return (
            <View style={styles.wrapper}>
                <TouchableOpacity style={styles.navigation__item} onPress={this.handleModal}>
                    <EntypoItem size={20} name="cycle" color={`${'#404040'}`} />
                    <Text style={styles.navigation__item__text}>{ strings('dashboardStack.exchange') }</Text>
                </TouchableOpacity>
                <View style={{...styles.navigation__item, marginTop: -40}}>
                    <View style={styles.navigation__item__content}>
                        <View style={{ marginTop: Platform.OS === 'ios' ? 0 : -24 }}>
                            <ToolTips ref={ref => this.buySellBtnTooltip = ref} tipType='HOME_SCREEN_BUY_SELL_BTN_TIP'>
                                <View style={[styles.navigation__main__container, { position: 'absolute', top: 0, left: 10 }]}>
                                    <TouchableOpacity style={[styles.navigation__main, { shadowColor: '#fff', shadowOpacity: 0, elevation: 0 }]}
                                                      onPress={this.handleMainBtn}
                                                      activeOpacity={0.8}
                                                      onLongPress={this.handleChangeBtn}>
                                        <FontistoIcon size={20} name={ btnType === 'BUY' ? 'shopping-basket-add' : 'shopping-basket-remove' } color={`${'#404040'}`}/>
                                        <Text style={{...styles.navigation__item__text, color: '#404040'}}>{ strings(btnType === 'BUY' ?  'dashboardStack.buy' : 'dashboardStack.sell') }</Text>
                                    </TouchableOpacity>
                                </View>
                            </ToolTips>
                        </View>
                        <View style={[styles.navigation__main__container, { position: 'absolute', top: 0, left: 10, zIndex: 100 }]}>
                            <TouchableOpacity style={styles.navigation__main}
                                              onPress={this.handleMainBtn}
                                              activeOpacity={0.8}
                                              onLongPress={this.handleChangeBtn}>
                                <FontistoIcon size={20} name={ btnType === 'BUY' ? 'shopping-basket-add' : 'shopping-basket-remove' } color={`${'#404040'}`}/>
                                <Text style={{...styles.navigation__item__text, color: '#404040'}}>{ strings(btnType === 'BUY' ?  'dashboardStack.buy' : 'dashboardStack.sell') }</Text>
                            </TouchableOpacity>
                        </View>
                        <Image
                            style={styles.navigation__main__shadow}
                            resizeMode='stretch'
                            source={ Platform.OS === 'ios' ? require('../../../assets/images/mainBtnShadowIOS.png') : require('../../../assets/images/mainBtnShadowAndroid.png') }/>
                    </View>
                </View>
                <TouchableOpacity style={styles.navigation__item} onPress={this.handleSettings}>
                    <IconAwesome size={20} name="gear" color={`${'#404040'}`} />
                    <Text style={styles.navigation__item__text}>{ strings('dashboardStack.settings') }</Text>
                </TouchableOpacity>
                <View style={styles.wrapper__shadow}>
                    <View style={styles.wrapper__shadow__item} />
                </View>
            </View>
        )
    }
}

export default BottomNavigation

const styles = {
    wrapper: {
        flexDirection: 'row',

        position: 'relative',
        zIndex: 2,

        width: '100%',
        height: deviceModel === 'iPhone X' ? 108 : 78,
        paddingTop: 22,
    },
    wrapper__shadow: {
        position: 'absolute',
        top: 20,
        left: 0,
        bottom: 0,
        right: 0,

        backgroundColor: '#fff',

        zIndex: 1
    },
    wrapper__shadow__item: {
        flex: 1,

        // marginTop: 20,

        backgroundColor: '#fff',

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
    navigation__item: {
        position: 'relative',
        alignItems: 'center',

        flex: 1,

        paddingVertical: 6,

        zIndex: 2
    },
    navigation__item__content: {
        position: 'relative',
        width: 80,
    },
    navigation__item_main: {
        marginTop: -30
    },
    navigation__item__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    navigation__main: {
        // position: 'absolute',
        // left: 0,
        // top: 0,

        justifyContent: 'center',
        alignItems: 'center',

        width: 60,
        height: 60,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,

        backgroundColor: '#fff',

        borderRadius: 30,
        zIndex: 3
    },
    navigation__main__container: {
        position: 'relative',

        // width: 60,
        // height: 60,

        backgroundColor: '#fff',
        borderRadius: 40,
        zIndex: 3
    },
    navigation__main__shadow: {
        position: 'absolute',
        top: 20,
        left: -30,

        width: 140,
        height: 64,

        zIndex: 2
    },
    navigation__main__white: {
        position: 'absolute',
        top: -55,
        left: -35,

        width: 80,
        height: 80,

        backgroundColor: '#fff',
        borderRadius: 80,
    }
}