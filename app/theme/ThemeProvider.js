/**
 * @version 0.50
 */
import React from 'react'
import { Dimensions, PixelRatio } from 'react-native'
import { Appearance } from 'react-native-appearance'

import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { colorsLight } from '@app/theme/colorsLight'
import { colorsDark } from '@app/theme/colorsDark'
import changeNavigationBarColor from 'react-native-navigation-bar-color'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let GRID_SIZE = 16
if (PIXEL_RATIO <= 2 && SCREEN_WIDTH < 330) {
    GRID_SIZE = 8 // iphone 5s
}

let SYSTEM_COLOR_SCHEME = Appearance.getColorScheme()
if (SYSTEM_COLOR_SCHEME === 'no-preference') SYSTEM_COLOR_SCHEME = 'light'

let subscription

export const ThemeContext = React.createContext({
    isLight: true,
    color: colorsLight,
    GRID_SIZE,
})

export class ThemeProvider extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isLight: SYSTEM_COLOR_SCHEME === 'light'
        }
        this.getThemeSetting()
    }

    componentDidMount() {
        subscription = Appearance.addChangeListener(({ colorScheme }) => {
            this.changeTheme(colorScheme)
          });
    }

    componentWillUnmount() {
        subscription.remove()
    }

    getThemeSetting = async () => {
        try {
            const res = await trusteeAsyncStorage.getThemeSetting()
            if (res !== null) {
                this.setState(() => ({ isLight: res === 'light' }))
            }
        } catch (e) {

        }
    }

    changeTheme = async (colorScheme = false) => {
        const newTheme = colorScheme || (this.state.isLight ? 'dark' : 'light')
        const isLight = newTheme === 'light'
        const colors = isLight ? colorsLight : colorsDark
        this.setState(() => ({ isLight }))
        await trusteeAsyncStorage.setThemeSetting(newTheme)
        changeNavigationBarColor( colors.common.background, isLight )
    }

    render() {
        const { isLight } = this.state
        const defaultTheme = {
            isLight,
            colors: isLight ? colorsLight : colorsDark,
            GRID_SIZE,
            changeTheme: this.changeTheme
        }
        MarketingEvent.UI_DATA.IS_LIGHT = isLight
        return (
            <ThemeContext.Provider value={defaultTheme}>
                {this.props.children}
            </ThemeContext.Provider>
        )
    }
}

export const useTheme = () => React.useContext(ThemeContext)
