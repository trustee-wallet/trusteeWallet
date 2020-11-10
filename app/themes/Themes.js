/**
 * @version 0.9
 */
import _ from 'lodash'

import styles from './assets/styles'
import blueTheme from './assets/blueTheme'


// Defines how far your touch can start away from the button
export const HIT_SLOP = { top: 5, right: 5, bottom: 5, left: 5 };

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
