import React, { Component } from 'react'
import {
    View,
    Dimensions
} from 'react-native'
import RoundButton from '../../../components/elements/new/buttons/RoundButton'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class Buttons extends Component {

    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {

        const { data, title } = this.props

        return (
            <View style={{ width: SCREEN_WIDTH < 300 ? '80%' : 300, alignSelf: 'center' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    {data.map((item) => {
                        return (
                            // eslint-disable-next-line react/jsx-key
                            <View style={{ flexDirection: 'column', alignItems: 'center', width: 90 }}>
                                <RoundButton
                                    type={item.icon}
                                    size={54}
                                    onPress={() => item.action()}
                                    title={title && item.title}
                                />
                            </View>
                        )
                    })}
                </View>
            </View>
        )
    }

}

export default Buttons