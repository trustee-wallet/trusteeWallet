/**
 * @version 2.1
 * @author yura
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const Switch = (props) => {
    const {
        onPress,
        circleColor,
        activeBackgroundColor,
        inactiveBackgroundColor,
        value,
        disabled = false,
        disabledWithOpacity = false,
        animated = true,
        width = 44
    } = props

    const [localValue, setLocalValue] = useState(false)

    const switchTranslate = useSharedValue(value ? (width - 6) / 2 : 0)

    useEffect(() => {
        if (localValue) {
            switchTranslate.value = (width - 6) / 2
        } else {
            switchTranslate.value = 0
        }
    }, [localValue])

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    const interpolateBackgroundColor = useAnimatedStyle(() => {
        return {
            backgroundColor: withSpring(!switchTranslate.value ? inactiveBackgroundColor : activeBackgroundColor, {
                mass: 0.1,
                damping: 20,
                stiffness: 20,
                overshootClamping: false,
                restSpeedThreshold: 0.001,
                restDisplacementThreshold: 0.001
            })
        }
    }, [])

    const transformCircle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: withSpring(switchTranslate.value, {
                        mass: 0.1,
                        damping: 20,
                        stiffness: 20,
                        overshootClamping: false,
                        restSpeedThreshold: 0.001,
                        restDisplacementThreshold: 0.001
                    })
                }
            ]
        }
    }, [])

    const memoizedOnSwitchPressCallback = useCallback(() => {
        if (disabled) return
        if (!animated) {
            onPress(!value)
            return
        }
        setLocalValue(!localValue)
        onPress(!value)
    }, [onPress, value, disabled, localValue])

    return (
        <Pressable
            onPress={memoizedOnSwitchPressCallback}
            disabled={disabledWithOpacity || disabled}
            style={{ opacity: !disabledWithOpacity ? 1 : 0.6 }}>
            <Animated.View style={[styles.containerStyle, interpolateBackgroundColor, { width }]}>
                <Animated.View
                    style={[
                        styles.circleStyle,
                        {
                            backgroundColor: circleColor,
                            width: (width - 2) / 2,
                            height: (width - 2) / 2,
                            borderRadius: (width - 2) / 2
                        },
                        transformCircle
                    ]}
                />
            </Animated.View>
        </Pressable>
    )
}

export default React.memo(Switch)

const styles = StyleSheet.create({
    circleStyle: {
        width: 22,
        height: 22,
        borderRadius: 22
    },
    containerStyle: {
        width: 44,
        paddingVertical: 2,
        paddingHorizontal: 2,
        borderRadius: 21
    }
})
