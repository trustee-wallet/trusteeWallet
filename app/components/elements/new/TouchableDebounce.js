/**
 * @version 0.53
 * @author yura
 */

import React, { PureComponent } from 'react'
import { TouchableOpacity } from 'react-native'

class TouchableDebounce extends PureComponent {

    disabled = false
    onPress = (...args) => {
        if (this.disabled) return
        this.disabled = true
        setTimeout(() => {
            this.disabled = false
        }, 300);
        this.props.onPress && this.props.onPress(...args)
    }

    render() {
        return (
            <TouchableOpacity
                {...this.props}
                onPress={this.onPress}
            >
                {this.props.children}
            </TouchableOpacity>
        );
    }
}

export default TouchableDebounce;
