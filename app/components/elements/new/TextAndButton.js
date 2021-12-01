/**
 * @version 0.31
 * @author Vadym
 */

import React from 'react'
import {
    View,
    Text,
    StyleSheet
} from 'react-native'

import { useTheme } from '@app/theme/ThemeProvider'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'

const TextAndButton = (props) => {

    const {
        title,
        buttonText,
        onPress,
        containerStyles
    } = props

    const { colors } = useTheme()

    return(
        <View style={containerStyles, styles.inputPosition}>
            <Text style={[styles.categoriesText, { color: colors.common.text3 }]}>{title}</Text>
            <BorderedButton
                text={buttonText}
                containerStyles={styles.inputButton}
                customTextStyles={styles.btnText}
                onPress={onPress}
            />
        </View>
    )
}

export default TextAndButton

const styles = StyleSheet.create({
    inputPosition: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 10,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    categoriesText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 17,
        minWidth: 120,
        maxWidth: 120,
    },
    inputButton: {
        minWidth: 120,
        maxWidth: 150,
        minHeight: 28,
    },
    btnText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 18,
        textTransform: 'none',
    },
})