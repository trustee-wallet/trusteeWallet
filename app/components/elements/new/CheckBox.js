
import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { useTheme } from '../../../modules/theme/ThemeProvider'

import { strings } from '../../../services/i18n'


const getStyle = (checked, title) => {
    const { colors } = useTheme()
    const style = {
        checkbox: [styles.checkbox],
        text: [styles.text]
    }

    if (checked) {
        style.checkbox.push({ backgroundColor: colors.common.checkbox.bgChecked })
    } else {
        style.checkbox.push(
            styles.unchecked,
            { borderColor: colors.common.checkbox.borderColorUnchecked }
        )
    }

    style.text.push({ color: colors.common.text3 })
    return style
};

export default function CheckBox(props) {
    const {
        checked = null,
        onPress,
        title,
        style
    } = props
    const { colors } = useTheme()
    const preparedStyles = getStyle(checked)

    return (
        <TouchableOpacity style={[styles.container, { ...style }]} onPress={onPress} activeOpacity={0.8}>
            <View style={[preparedStyles.checkbox]}>
                {checked && <Icon name="done" size={16} color={colors.common.background} />}
            </View>
            {typeof title === 'string' && <Text style={preparedStyles.text}>{title}</Text>}
            {typeof title === 'function' && title()}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    unchecked: {
        borderWidth: 1,
    },
    text: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        marginLeft: 12,
        letterSpacing: 1,
        // flex: 1,
    }
})
