/**
 * @version 0.41
 */
import { Component } from 'react'

export default class SendBasicScreen extends Component {

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }
}
