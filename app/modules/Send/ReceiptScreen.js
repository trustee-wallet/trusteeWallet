/**
 * @version 0.41
 */
import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'


class ReceiptScreen extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <View><Text>hi receipt</Text></View>
        )
    }
}

const mapStateToProps = (state) => {
}

export default connect(mapStateToProps, {})(ReceiptScreen)

const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}
