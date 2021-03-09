/**
 * @version 0.41
 */
import React, { Component } from 'react'
import NavStore from '@app/components/navigation/NavStore'

export default class SendBasicScreen extends Component {

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }

}
