import AsyncStorage from '@react-native-community/async-storage'

import _ from 'lodash'

import styles from './assets/styles'
import blueTheme from './assets/blueTheme'


export default new class Themes {

    /**
     * @type {Object}
     */
    styles = {}

    init() {
        this.styles = _.merge(styles, blueTheme)
    }

    /**
     * @returns {Object}
     */
    getStyles = () => this.styles

}