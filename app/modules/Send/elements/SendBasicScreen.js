/**
 * @version 0.41
 */
import React from 'react'

export default class SendBasicScreen extends React.PureComponent {

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }
}
