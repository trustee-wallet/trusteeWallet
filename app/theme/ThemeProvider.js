/**
 * @version 0.50
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Appearance, Dimensions, PixelRatio } from 'react-native'

import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { colorsLight } from '@app/theme/colorsLight'
import { colorsDark } from '@app/theme/colorsDark'
import changeNavigationBarColor from 'react-native-navigation-bar-color'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

const COLOR_SCHEME_FLICKER_DELAY_MS = 250

let GRID_SIZE = 16
if (PIXEL_RATIO <= 2 && SCREEN_WIDTH < 330) {
    GRID_SIZE = 8 // iphone 5s
}

let SYSTEM_COLOR_SCHEME = Appearance.getColorScheme()
if (SYSTEM_COLOR_SCHEME === 'no-preference') SYSTEM_COLOR_SCHEME = 'light'

export const ThemeContext = React.createContext({
    isLight: true,
    color: colorsLight,
    GRID_SIZE
})

export const ThemeProvider = (props) => {
    const [colorScheme, setColorScheme] = useState()

    const isSystemDarkMode = useColorScheme() === 'dark'

    useEffect(() => {
        if (colorScheme) {
            const isLight = colorScheme === 'light'
            trusteeAsyncStorage.setThemeSetting(colorScheme)
            const colors = isLight ? colorsLight : colorsDark
            changeNavigationBarColor(colors.common.background, isLight)
        }
    }, [colorScheme])

    useEffect(() => {
        const loadUserPref = async () => {
            const userPref = (await trusteeAsyncStorage.getThemeSetting()) || 'light'
            setColorScheme(userPref)
            Appearance.setColorScheme(userPref)
        }

        loadUserPref()
    }, [isSystemDarkMode])

    const defaultTheme = useMemo(() => {
        MarketingEvent.UI_DATA.IS_LIGHT = colorScheme === 'light'
        return {
            isLight: colorScheme === 'light',
            colors: colorScheme === 'light' ? colorsLight : colorsDark,
            GRID_SIZE,
            changeTheme: () => {
                const scheme = colorScheme === 'light' ? 'dark' : 'light'
                setColorScheme(scheme)
                Appearance.setColorScheme(scheme)
            }
        }
    }, [colorScheme])

    return <ThemeContext.Provider value={defaultTheme}>{props.children}</ThemeContext.Provider>
}

export const useTheme = () => React.useContext(ThemeContext)

function useColorScheme() {
    const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme())
    const timeout = useRef()

    const resetCurrentTimeout = useCallback(() => {
        if (timeout.current) {
            clearTimeout(timeout.current)
        }
    }, [timeout.current])

    const onColorSchemeChange = useCallback(
        (preferences) => {
            resetCurrentTimeout()
            timeout.current = setTimeout(() => {
                setColorScheme(preferences.colorScheme)
                Appearance.setColorScheme(preferences.colorScheme)
            }, COLOR_SCHEME_FLICKER_DELAY_MS)
        },
        [resetCurrentTimeout]
    )

    useEffect(() => {
        Appearance.addChangeListener(onColorSchemeChange)
        return () => {
            resetCurrentTimeout()
        }
    }, [onColorSchemeChange, resetCurrentTimeout])

    return colorScheme
}
