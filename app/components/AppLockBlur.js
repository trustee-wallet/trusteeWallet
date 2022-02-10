/**
 * @version 0.53
 * @author yura
 */
import React from 'react'
import { StyleSheet, Platform } from 'react-native'
import { BlurView } from "@react-native-community/blur"
import { connect } from 'react-redux'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { getIsBlurVisible } from '@app/appstores/Stores/Main/selectors'

class AppLockBlur extends React.PureComponent {

    render = () => {

        const blurColor = MarketingEvent.UI_DATA.IS_LIGHT ? 'light' : 'dark'

        return (
            <>
                {(this.props.isBlurVisible && Platform.OS === 'ios') ? (
                    <BlurView
                        style={StyleSheet.absoluteFill}
                        blurType={blurColor}
                        blurAmount={10}
                        reducedTransparencyFallbackColor='white'
                    />
                ) : null}
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        isBlurVisible: getIsBlurVisible(state)
    }
}

export default connect(mapStateToProps)(AppLockBlur)