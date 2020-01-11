import React, { Component } from 'react'
import { Animated, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { connect } from 'react-redux'

import Tooltip from 'rn-tooltip'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { strings } from '../../services/i18n'
import ToolTipsActions from '../../appstores/Actions/ToolTipsActions'
import settingsActions from '../../appstores/Actions/SettingsActions'
import NavStore from '../navigation/NavStore'


class ToolTips extends Component {

    constructor(props){
        super(props)
        this.state = {
            canShowNext: false,
            isCanBeShowed: true,
            toolTipsState: false,
            type: '',
            content: <View></View>,
            pressAnim: new Animated.Value(1),
        }
    }

    componentDidMount() {

        const { showAfterRender, prevToggleCallback, nextToggleCallback } = this.props
        const { tipsRef } = this.props.toolTipsStore

        if(typeof tipsRef[this.props.type] == "undefined"){
            ToolTipsActions.setToolTipRef({
                ref: {
                    toggleTooltip: () => {
                        typeof prevToggleCallback != 'undefined' ? prevToggleCallback() : null
                        setTimeout(() => {
                            this.refTooltip.toggleTooltip()
                        }, 300)
                        typeof nextToggleCallback != 'undefined' ? nextCallback() : null
                    },
                    isCanBeShowed: true
                },
                name: this.props.type,
            })
        }

        setTimeout(() => {
            try {
                if(typeof showAfterRender != 'undefined' && showAfterRender){
                    this.refTooltip.toggleTooltip()
                }
            } catch (e) {}
        }, 300)
    }

    animatePress = () => {
        Animated.timing(this.state.pressAnim, {
            toValue: 0.2,
            duration: 300
        }).start()

        // setTimeout(() => {
        //     Animated.timing(this.state.pressAnim, {
        //         toValue: 1,
        //         duration: 100
        //     }).start()
        // }, 100)
    }

    renderTip = () => {
        const { tipsRef } = this.props.toolTipsStore
        const { type, nextCallback } = this.props
        let content
        let nextBtnCallback
        let nextBtnText
        let isSkip
        // let isVisible

        switch (type) {
            case 'HOME_SCREEN_BUY_BTN_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                nextBtnText = strings(`tooltips.buttons.next`)
                isSkip = true
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    tipsRef['HOME_SCREEN_EXCHANGE_BTN_TIP'].toggleTooltip()
                    setTimeout(() => {
                        this.state.canShowNext = false
                        this.setState({ isCanBeShowed: false })
                    }, 0)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.HOME_SCREEN_BUY_BTN_TIP.title`), strings(`tooltips.HOME_SCREEN_BUY_BTN_TIP.description`), nextBtnCallback, nextBtnText, isSkip)
                break
            case 'HOME_SCREEN_EXCHANGE_BTN_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                nextBtnText = strings(`tooltips.buttons.next`)
                isSkip = true
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    tipsRef['HOME_SCREEN_CRYPTO_BTN_TIP'].toggleTooltip()
                    setTimeout(() => {
                        this.state.canShowNext = false
                        this.setState({ isCanBeShowed: false })
                    }, 0)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.HOME_SCREEN_EXCHANGE_BTN_TIP.title`), strings(`tooltips.HOME_SCREEN_EXCHANGE_BTN_TIP.description`), nextBtnCallback, nextBtnText, isSkip)
                break
            case 'HOME_SCREEN_CRYPTO_BTN_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                nextBtnText = strings(`tooltips.buttons.next`)
                isSkip = true
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    tipsRef['HOME_SCREEN_ADD_CRYPTO_BTN_TIP'].toggleTooltip()
                    setTimeout(() => {
                        this.state.canShowNext = false
                        this.setState({ isCanBeShowed: false })
                    }, 0)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.HOME_SCREEN_CRYPTO_BTN_TIP.title`), strings('tooltips.HOME_SCREEN_CRYPTO_BTN_TIP.description'), nextBtnCallback, nextBtnText, isSkip)
                break
            case 'HOME_SCREEN_QR_BTN_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                nextBtnText = strings(`tooltips.buttons.close`)
                isSkip = false
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    setTimeout(() => {
                        this.state.canShowNext = false
                    }, 0)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })

                    settingsActions.setSettings('tool_tips_state', 0)
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.HOME_SCREEN_QR_BTN_TIP.title`), strings('tooltips.HOME_SCREEN_QR_BTN_TIP.description'), nextBtnCallback, nextBtnText, isSkip)
                break
            case 'ACCOUNT_SCREEN_ADDRESS_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                const { currencyName } = this.props.cryptocurrency

                console.log(strings('tooltips.ACCOUNT_SCREEN_ADDRESS_TIP.description',  { currencyName: currencyName }))

                nextBtnText = nextBtnText = strings(`tooltips.buttons.next`)
                isSkip = true
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    tipsRef['ACCOUNT_SCREEN_TRANSACTION_TIP'].toggleTooltip()
                    setTimeout(() => {
                        this.state.canShowNext = false
                        this.setState({ isCanBeShowed: false })
                    }, 0)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.ACCOUNT_SCREEN_ADDRESS_TIP.title`), strings('tooltips.ACCOUNT_SCREEN_ADDRESS_TIP.description', { currencyName: currencyName }), nextBtnCallback, nextBtnText, isSkip)
                break
            case 'ACCOUNT_SCREEN_TRANSACTION_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                nextBtnText = nextBtnText = strings(`tooltips.buttons.next`)
                isSkip = true
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    nextCallback()
                    setTimeout(() => {
                        tipsRef['ACCOUNT_SCREEN_ORDERS_TIP'].toggleTooltip()
                        setTimeout(() => {
                            this.state.canShowNext = false
                            this.setState({ isCanBeShowed: false })
                        }, 0)
                    }, 500)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.ACCOUNT_SCREEN_TRANSACTION_TIP.title`), strings('tooltips.ACCOUNT_SCREEN_TRANSACTION_TIP.description'), nextBtnCallback, nextBtnText, isSkip)
                break
            case 'ACCOUNT_SCREEN_ORDERS_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                nextBtnText = nextBtnText = strings(`tooltips.buttons.close`)
                isSkip = false
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    setTimeout(() => {
                        this.state.canShowNext = false
                        this.setState({ isCanBeShowed: false })
                    }, 0)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })

                    settingsActions.setSettings('tool_tips_state', 0)
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.ACCOUNT_SCREEN_ORDERS_TIP.title`), strings('tooltips.ACCOUNT_SCREEN_ORDERS_TIP.description'), nextBtnCallback, nextBtnText, isSkip)
                break
            case 'HOME_SCREEN_ADD_CRYPTO_BTN_TIP':
                // isVisible = tipsStates.homeScreen.sellBuyBtn
                nextBtnText = strings(`tooltips.buttons.close`)
                isSkip = false
                nextBtnCallback = (showNext = true) => {
                    this.state.canShowNext = true
                    showNext ? this.refTooltip.toggleTooltip() : null
                    setTimeout(() => {
                        this.setState({ isCanBeShowed: false })
                        this.state.canShowNext = false
                    }, 0)

                    ToolTipsActions.setToolTipRef({
                        ref: { isCanBeShowed: false },
                        name: this.props.type,
                    })
                }

                this.nextBtnCallback = nextBtnCallback

                content = this.renderTemplateTip(strings(`tooltips.HOME_SCREEN_ADD_CRYPTO_BTN_TIP.title`), strings(`tooltips.HOME_SCREEN_ADD_CRYPTO_BTN_TIP.description`), nextBtnCallback, nextBtnText, isSkip)
                break
            default:
                // isVisible = false
                content = <View><Text>Default</Text></View>
        }

        // const { tool_tips_state } = this.props.settingsStore.data
        // const toolTipsState = typeof tool_tips_state == 'undefined' ? true : tool_tips_state === '0' ? false : true
        //
        // this.setState({
        //     isVisible,
        //     content,
        //     toolTipsState
        // })

        return content
    }

    renderTemplateTip = (text, description, nextBtnCallback, nextBtnText, isSkip) => {
        return  <View style={{ width: '100%', flex: 1, backgroundColor: '#732bb1', borderRadius: 10 }}>
                    <View style={{ margin: 10, marginBottom: 0, flexDirection: 'row' }}>
                        {/*<Text style={{ marginBottom: 5, fontSize: 14, fontFamily: 'SFUIDisplay-Semibold', color: '#f4f4f4' }}>*/}
                        {/*    { text }*/}
                        {/*</Text>*/}
                        <Text style={{ width: '100%', fontFamily: 'SFUIDisplay-Regular', fontSize: 12, color: '#f4f4f4', }}>
                            { description }
                        </Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            {
                                isSkip ?
                                    <TouchableOpacity onPress={this.skip}>
                                        <View style={{ height: 20, margin: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderColor: '#fff', borderWidth: 1, borderStyle: 'solid', borderRadius: 5 }}>
                                            <Text style={{ fontFamily: 'SFUIDisplay-Regular', fontSize: 12, color: '#fff' }}>{ strings(`tooltips.buttons.skip`) }</Text>
                                        </View>
                                    </TouchableOpacity> : null
                            }

                            <TouchableOpacity style={{ marginLeft: !isSkip ? 'auto' : 0 }} onPress={nextBtnCallback}>
                                <View style={{ margin: 10, paddingHorizontal: 5, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#fff' }}>
                                    <Text style={{ fontFamily: 'SFUIDisplay-Regular', fontSize: 12, color: '#732bb1' }}>{ nextBtnText }</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
    }

    handleClose = () => {
        if(!this.state.canShowNext)
            this.nextBtnCallback(false)
    }

    skip = () => {
        this.state.canShowNext = true
        this.refTooltip.toggleTooltip()
        this.setState({ isCanBeShowed: false })
        settingsActions.setSettings('tool_tips_state', 0)
    }

    renderTooltips = () => {
        const { isCanBeShowed } = this.state
        const { height, settingsStore, MainComponent, mainComponentProps, animatePress, toolTipsStore } = this.props

        const { tipsRef } = this.props.toolTipsStore

        const isShow = typeof settingsStore.data.tool_tips_state == 'undefined' || +settingsStore.data.tool_tips_state

        if(isShow && typeof tipsRef[this.props.type] != "undefined" && tipsRef[this.props.type].isCanBeShowed && isCanBeShowed){
            if(typeof animatePress == 'undefined'){
                return (
                    <Tooltip ref={ref => this.refTooltip = ref}
                             pointerColor={'#732bb1'}
                             width={200}
                             height={height}
                             onClose={this.handleClose}
                             containerStyle={styles.containerStyle}
                             popover={this.renderTip()}
                             handleClose={() => { this.handleClose() }}>
                        <MainComponent self={this} disabled={true} {...mainComponentProps} />
                    </Tooltip>
                )
            } else {
                return (
                    <Tooltip ref={ref => this.refTooltip = ref}
                             pointerColor={'#732bb1'}
                             width={200}
                             height={height}
                             onClose={this.handleClose}
                             containerStyle={styles.containerStyle}
                             popover={this.renderTip()}
                             handleClose={() => { this.handleClose() }}>
                        <Animated.View style={{ opacity: this.state.pressAnim }}>
                            <MainComponent self={this} disabled={true} {...mainComponentProps} />
                        </Animated.View>
                    </Tooltip>
                )
            }
        } else {
            return (
                <MainComponent {...mainComponentProps} />
            )
        }
    }

    render(){
        return this.renderTooltips()
    }
}

const mapStateToProps = (state) => {
    return {
        toolTipsStore: state.toolTipsStore,
        settingsStore: state.settingsStore
    }
}

export default connect(mapStateToProps, {}, null, { forwardRef: true })(ToolTips)

const styles = {
    containerStyle: {
        flex: 1,

        padding: 0,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,

        backgroundColor: '#732bb1',
        borderRadius: 10
    }
}