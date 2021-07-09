/**
 * @version 0.11
 * @misha could be optimized?
 */
import React, { Component } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import Tooltip from 'rn-tooltip'

import { strings } from '../../services/i18n'
import ToolTipsActions from '../../appstores/Stores/ToolTips/ToolTipsActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'

import { ThemeContext } from '@app/theme/ThemeProvider'
import CustomIcon from './CustomIcon'


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

        if(typeof tipsRef[this.props.type] === "undefined"){
            ToolTipsActions.setToolTipRef({
                ref: {
                    toggleTooltip: () => {
                        typeof prevToggleCallback !== 'undefined' ? prevToggleCallback() : null
                        setTimeout(() => {
                            if (typeof this.refTooltip !== 'undefined') {
                                this.refTooltip.toggleTooltip()
                            }
                        }, 300)
                        typeof nextToggleCallback !== 'undefined' ? nextCallback() : null
                    },
                    isCanBeShowed: true
                },
                name: this.props.type,
            })
        }

        setTimeout(() => {
            try {
                if(typeof showAfterRender !== 'undefined' && showAfterRender){
                    if (typeof this.refTooltip !== 'undefined') {
                        this.refTooltip.toggleTooltip()
                    }
                }
            } catch (e) {}
        }, 300)
    }

    renderTip = () => {
        const { tipsRef } = this.props.toolTipsStore
        const { type } = this.props
        let content
        let nextBtnCallback
        let nextBtnText
        let isSkip

        switch (type) {
            case 'HOME_SCREEN_BUY_BTN_TIP':
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
                const { currencyName } = this.props.cryptoCurrency

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
        return content
    }

    renderTemplateTip = (text, description, nextBtnCallback, nextBtnText, isSkip) => {

        const { colors, GRID_SIZE } = this.context

        return  <View style={{ width: '100%', flex: 1, backgroundColor: colors.toolTips.background, borderRadius: 16 }}>
                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: 18, marginBottom: 0, flexDirection: 'row' }}>
                        <Text style={{ width: '100%', fontFamily: 'SFUIDisplay-Regular', fontSize: 15, lineHeight: 19, color: colors.common.text1, }}>
                            { description }
                        </Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            {
                                isSkip ?
                                    <TouchableOpacity onPress={this.skip} hitSlop={{top: 10, right: 10, bottom: 10, left: 10}} >
                                        <View style={{ height: 30, marginLeft: GRID_SIZE, marginTop: 6 }}>
                                            <CustomIcon name={'close'} size={18} color={colors.common.text1} />
                                        </View>
                                    </TouchableOpacity> : null
                            }

                            <TouchableOpacity style={{ marginLeft: !isSkip ? 'auto' : 0 }} onPress={nextBtnCallback} hitSlop={{top: 10, right: 10, bottom: 10, left: 10}} >
                                <View style={{ marginRight: GRID_SIZE, marginBottom: 19, paddingHorizontal: 5, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: colors.common.text1 }}>
                                    <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 10, letterSpacing: 0.5, color: colors.toolTips.background }}>{ nextBtnText }</Text>
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
        const { height, settingsStore, MainComponent, mainComponentProps, animatePress } = this.props

        const { tipsRef } = this.props.toolTipsStore

        const { colors, isLight } = this.context

        const isShow = typeof settingsStore.data.tool_tips_state == 'undefined' || +settingsStore.data.tool_tips_state

        if(isShow && typeof tipsRef[this.props.type] !== "undefined" && tipsRef[this.props.type].isCanBeShowed && isCanBeShowed){
            if(typeof animatePress === 'undefined'){
                return (
                    <Tooltip ref={ref => this.refTooltip = ref}
                             pointerColor={colors.toolTips.background}
                             width={250}
                             height={height}
                             onClose={this.handleClose}
                             containerStyle={styles.containerStyle}
                             popover={this.renderTip()}
                             highlightColor={colors.toolTips.background}
                             overlayColor={'#99999940'}
                             handleClose={() => { this.handleClose() }}>
                            <MainComponent self={this} disabled={true} {...mainComponentProps} />
                    </Tooltip>
                )
            } else {
                return (
                    <Tooltip ref={ref => this.refTooltip = ref}
                             pointerColor={colors.toolTips.background}
                             width={250}
                             height={height}
                             onClose={this.handleClose}
                             containerStyle={styles.containerStyle}
                             popover={this.renderTip()}
                             overlayColor={'#99999940'}
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

ToolTips.contextType = ThemeContext

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

        // backgroundColor: '#732bb1',
        borderRadius: 16,
        zIndex: 3
    }
}
