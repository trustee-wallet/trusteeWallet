import React from 'react'
import { Dimensions, PixelRatio } from 'react-native'

import { useColorScheme } from 'react-native-appearance'

import { lightColors, darkColors } from './colors'


const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let GRID_SIZE = 16
if (PIXEL_RATIO <= 2 && SCREEN_WIDTH < 330) {
    GRID_SIZE = 8 // iphone 5s
}


export const ThemeContext = React.createContext({
    isLight: true,
    color: lightColors,
    GRID_SIZE,
})

export const ThemeProvider = (props) => {
    const colorScheme = useColorScheme()

    const [isLight, setIsLight] = React.useState(colorScheme !== 'dark')
    React.useEffect(() => { setIsLight(colorScheme !== 'dark') }, [colorScheme])

    const defaultTheme = {
        isLight,
        colors: isLight ? lightColors : darkColors,
        GRID_SIZE,
    }

    return (
        <ThemeContext.Provider value={defaultTheme}>
            {props.children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => React.useContext(ThemeContext)
