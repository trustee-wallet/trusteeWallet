/**
 * @version 0.50
 * @author yura
 */
import React from 'react'
import {
    View,
    Text,
    Animated,
    TouchableOpacity,
    StyleSheet
} from 'react-native'

import CustomIcon from '../CustomIcon'
import { SIZE } from '@app/modules/WalletList/helpers'
import { HIT_SLOP } from '@app/theme/HitSlop'
import { ThemeContext } from '@app/theme/ThemeProvider'

class InfoNotification extends React.Component {

    state = {
        viewHeight: 0,
        height: new Animated.Value(0)
    }

    processViewHeight = (e) => {
        this.setState({
            viewHeight: e.nativeEvent.layout.height
        })
    }

    close = () => {
        const {
            closeCallback
        } = this.props

        Animated.timing(this.state.height, {
            toValue: 1,
            duration: 500
        }).start(() => {
            closeCallback()
        })
    }

    render() {

        const {
            title,
            subTitle,
            onPress,
            containerStyles,
            range
        } = this.props

        const { colors, GRID_SIZE } = this.context

        const backupAnimaStyle = {
            transform: [
                {
                    scaleY: this.state.height.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0]
                    })
                },
                {
                    translateY: range ? this.state.viewHeight / 2 : this.state.height
                }
            ],
            marginVertical: this.state.height.interpolate({
                inputRange: [0, 1],
                outputRange: [GRID_SIZE / 2, -(this.state.viewHeight / 2)]
            }),
            opacity: this.state.height.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0]
            })
        }

        return (
            <Animated.View style={[styles.container, backupAnimaStyle, containerStyles, { backgroundColor: colors.homeScreen.backupBg }]}>
                <TouchableOpacity
                    onPress={onPress}
                    style={styles.backupWrapper}
                    onLayout={this.processViewHeight}
                >
                    <CustomIcon name='warningMessage' size={24} color={colors.walletManagment.walletItemBorderColor} style={styles.iconWrapper} />
                    <View style={styles.description}>
                        <Text style={[styles.backupName, { color: colors.walletManagment.walletItemBorderColor }]}>{title}</Text>
                        <Text style={[styles.backupDescription, { color: colors.homeScreen.backupDescription }]}>{subTitle}</Text>
                    </View>
                    <TouchableOpacity onPress={this.close} style={styles.close} hitSlop={HIT_SLOP}>
                        <CustomIcon name='close' size={18} color={colors.common.button.text} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        )
    }
}

InfoNotification.contextType = ThemeContext

export default InfoNotification

const styles = StyleSheet.create({
    container: {
        borderRadius: SIZE,
        zIndex: 2
    },
    backupWrapper: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 16
    },
    iconWrapper: {
        alignSelf: 'flex-start',
    },
    description: {
        flex: 2,
        flexDirection: 'column',
        justifyContent: 'center',

        paddingLeft: 10
    },
    backupDescription: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.5,

        paddingTop: 6
    },
    backupName: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        paddingTop: 5
    },
    close: {
        height: 24
    }
})
