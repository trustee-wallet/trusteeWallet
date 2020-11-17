import React from 'react'

import { useColorScheme } from 'react-native-appearance'

import { lightColors, darkColors } from './colors'


export const ThemeContext = React.createContext({
    isLight: true,
    color: lightColors,
})

export const ThemeProvider = (props) => {
    const colorScheme = useColorScheme()

    const [isLight, setIsLight] = React.useState(colorScheme === 'light')
    React.useEffect(() => { setIsLight(colorScheme === 'light') }, [colorScheme])

    const defaultTheme = {
        isLight,
        colors: isLight ? lightColors : darkColors,
    }

    return (
        <ThemeContext.Provider value={defaultTheme}>
            {props.children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => React.useContext(ThemeContext)
