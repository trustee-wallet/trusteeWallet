/**
 * @version 0.41
 */
import React from 'react'
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'


class SendAdvancedFees extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            isBalanceVisible : false
        }
    }


    render() {
       return <View><Text>dfgadfg</Text></View>
    }
}

SendAdvancedFees.contextType = ThemeContext

export default connect(null, {})(SendAdvancedFees)
