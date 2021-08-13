/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { TextInput, StyleSheet } from 'react-native'

import { strings } from '../../../../app/services/i18n'

export default class Input extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <TextInput 
                style={styles.input} 
                placeholder={strings('components.elements.modal.input.placeholder')} 
                onChangeText={(text) => this.props.handleInput(text)} 
                value={this.props.value}
                allowFontScaling={false}
            />
        )
    }
}

const styles = StyleSheet.create({
    input: {
        marginLeft: 30,
        marginRight: 30,
        paddingLeft: 3,
        marginTop: 10,
        paddingRight: 3,
        paddingTop: 0,
        paddingBottom: 2,
        fontSize: 16,
        // fontFamily: 'SanFran-Regular',
        borderBottomColor: '#8e96b5',
        borderBottomWidth: 2
    }
})
