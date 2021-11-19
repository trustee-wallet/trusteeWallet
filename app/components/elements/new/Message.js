/**
 * @version 0.43
 * @author Vadym
 */

import React from 'react'
import {
    StyleSheet,
    Text,
    View
} from 'react-native'
import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/theme/ThemeProvider'
import LottieView from 'lottie-react-native'
import ProgressAnimation from '@assets/jsons/animations/pieWithStroke.json'

const Message = (props) => {

    const {
        colors,
    } = useTheme()

    const {
        containerStyles,
        progress,
        timer,
        name,
        text
    } = props

    return (
        <View style={[styles.infoContainer, containerStyles]}>
            {timer || false ? (
                <LottieView color={colors.createWalletScreen.keyIcon} source={ProgressAnimation} style={{ width: 24, height: 24 }} progress={progress} />
            ) : (
                <View style={[styles.keyCircle, { borderColor: colors.createWalletScreen.showMnemonic.showButtonText }]}>
                    <CustomIcon name={name} size={16} color={colors.createWalletScreen.showMnemonic.showButtonText} />
                </View>
            )}
            <Text style={[styles.infoText, { color: colors.common.text3 }]}>{text}</Text>
        </View>
    )
}


export default Message

const styles = StyleSheet.create({
    keyCircle: {
        width: 24,
        height: 24,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    infoText: {
        marginLeft: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        flex: 1
    }
})
