import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import Tooltip from 'react-native-walkthrough-tooltip'

import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { strings } from '../../services/i18n'
import ToolTipsActions from '../../appstores/Actions/ToolTipsActions'
import settingsActions from '../../appstores/Actions/SettingsActions'

class ToolTips extends Component {

    constructor(props){
        super(props)
        this.state = {
            isVisible: false,
            toolTipsState: false,
            content: <View></View>
        }
    }

    componentWillMount() {
        const { tool_tips_state } = this.props.settingsStore.data
        typeof tool_tips_state != 'undefined' && tool_tips_state === '0' ? ToolTipsActions.setToolTipState('HOME_SCREEN_BUY_SELL_BTN_TIP') : null

        this.initTip()
    }

    componentWillReceiveProps(nextProps) {

        if(typeof nextProps.toolTipsStore != 'undefined'){
            this.setState({
                isVisible: nextProps.toolTipsStore.tipsStates.homeScreen.sellBuyBtn,
                toolTipsState: nextProps.toolTipsStore.tipsStates.homeScreen.sellBuyBtn
            })
        }
    }

    initTip = () => {
        const { tipsStates } = this.props.toolTipsStore
        const { tipType } = this.props
        let content
        let isVisible

        switch (tipType) {
            case 'HOME_SCREEN_BUY_SELL_BTN_TIP':
                isVisible = tipsStates.homeScreen.sellBuyBtn
                content = <View style={{ flex: 1, position: 'relative', padding: 10, backgroundColor: '#732bb1' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ marginBottom: 5, fontSize: 12, fontFamily: 'SFUIDisplay-Semibold', color: '#f4f4f4' }}>
                                        { strings('tips.homeScreen.sellBuyBtn.title') }
                                    </Text>
                                    <TouchableOpacity style={{ position: 'absolute', top: -20, right: -20, padding: 20 }} onPress={this.handleClose}>
                                        <AntDesignIcon name='close' size={14} color='#f4f4f4' />
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ maxWidth: 200, fontFamily: 'SFUIDisplay-Regular', fontSize: 10, color: '#f4f4f4', }}>
                                    { strings('tips.homeScreen.sellBuyBtn.description') }
                                </Text>
                          </View>
                break
            default:
                isVisible = false
                content = <View><Text>Default</Text></View>
        }

        const { tool_tips_state } = this.props.settingsStore.data
        const toolTipsState = typeof tool_tips_state == 'undefined' ? true : tool_tips_state === '0' ? false : true

        this.setState({
            isVisible,
            content,
            toolTipsState
        })
    }

    hideTooltip = () => {
        this.setState({
            isVisible: false
        })
    }

    handleClose = () => {
        this.setState({
            isVisible: false
        })

        settingsActions.setSettings('tool_tips_state', 0)
        ToolTipsActions.setToolTipState('HOME_SCREEN_BUY_SELL_BTN_TIP')
    }

    render(){

        const { isVisible, content, toolTipsState } = this.state
        const { licence_terms_accepted } = this.props.settingsStore.data

        return toolTipsState && typeof licence_terms_accepted != 'undefined' ? (
            <Tooltip
                     arrowStyle={{ borderTopColor: '#732bb1' }}
                     contentStyle={{ backgroundColor: '#732bb1' }}
                     isVisible={isVisible}
                     content={content}
                     placement="top"

                    onClose={() => {}}>
                { this.props.children }
            </Tooltip>
        ) : <View style={{ position: 'absolute' }} />
    }
}

const mapStateToProps = (state) => {
    return {
        toolTipsStore: state.toolTipsStore,
        settingsStore: state.settingsStore
    }
}

export default connect(mapStateToProps, {}, null, { forwardRef: true })(ToolTips)