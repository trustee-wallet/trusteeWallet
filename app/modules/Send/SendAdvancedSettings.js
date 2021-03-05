/**
 * @version 0.41
 */
import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'


class SendAdvancedSettings extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <View><Text>hi advanced</Text></View>
        )
    }
}

const mapStateToProps = (state) => {
}

export default connect(mapStateToProps, {})(SendAdvancedSettings)

const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

