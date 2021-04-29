/**
 * @version 0.43
 * @author yura
 */

import React, { PureComponent } from 'react'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { View, SafeAreaView } from 'react-native'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import Header from '@app/components/elements/new/Header'

class ScreenWrapper extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0,
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    render() {

        const {
            colors
        } = this.context
        const { headerHeight } = this.state
        const { title, rightAction, rightType, leftType, leftAction, leftParams, rightParams, ExtraView, ExtraViewParams, withoutSafeArea } = this.props

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    title={title}
                    leftType={leftType}
                    leftAction={leftAction}
                    leftParams={leftParams}
                    rightType={rightType}
                    rightAction={rightAction}
                    rightParams={rightParams}
                    ExtraView={ExtraView}
                    ExtraViewParams={ExtraViewParams}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <KeyboardAwareView>
                    {withoutSafeArea ?
                        this.props.children
                        :
                        <SafeAreaView style={{
                            flex: 1,
                            backgroundColor: colors.common.background,
                            marginTop: headerHeight,
                        }}>
                            {this.props.children}
                        </SafeAreaView>
                    }
                </KeyboardAwareView>
            </View>
        )
    }
}

ScreenWrapper.contextType = ThemeContext

export default ScreenWrapper