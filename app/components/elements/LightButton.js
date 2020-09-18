/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { BoxShadow } from 'react-native-shadow'
import rnTextSize from 'react-native-text-size'
import OldPhone from '../../services/UI/OldPhone/OldPhone'


export default class LightButton extends Component {

    constructor(props) {
        super(props)
        this.state = {
            width: 100
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        try {
            const size = await rnTextSize.measure({ text: this.props.title, fontSize: 10, fontFamily: 'Montserrat-Bold' })

            this.setState({
                width: size.width.toFixed()
            })
        } catch (e) {

        }
    }


    render() {

        const { width } = this.state
        const { title, Icon, iconStyle, disabled } = this.props

        if (OldPhone.isOldPhone()) {
            return <View setting={{ ...styles.button__wrapper, width: +width + 32, backgroundColor: '#f5f5f5' }}>
                <View style={[styles.button__content, { backgroundColor: '#f5f5f5' }]}>
                    <Icon style={{ ...styles.button_icon, ...iconStyle }}/>
                    <Text style={[styles.button__text, { color: '#404040' }]}>
                        {title}
                    </Text>
                </View>
            </View>
        }

        return (
            <BoxShadow setting={{ ...styles.button__wrapper, width: +width + 32, backgroundColor: '#f5f5f5' }}>
                <View style={[styles.button__content, { backgroundColor: '#f5f5f5' }]}>
                    <Icon style={{ ...styles.button_icon, ...iconStyle }}/>
                    <Text style={[styles.button__text, { color: '#404040' }]}>
                        {title}
                    </Text>
                </View>
            </BoxShadow>
        )
    }
}

const styles = {
    button__wrapper: {
        height: 30,
        color: '#404040',
        border: 4,
        radius: 5,
        opacity: 0.2,
        x: 0,
        y: 0,
        style: {
            marginVertical: 5,
            borderRadius: 50
        }
    },
    button__content: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderColor: '#404040',
        borderWidth: 1.5
    },
    button__text: {
        fontSize: 10,
        color: '#864DD9',
        fontFamily: 'Montserrat-Bold'
    },
    button_icon: {
        marginTop: 1,

        color: '#404040'
    },
    img__ver: {
        flex: 1,

        position: 'absolute',
        top: -6,
        left: 5,

        width: '103%',
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor: {
        flex: 1,

        position: 'absolute',
        top: -6,

        width: 10,
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor_right: {
        right: -5
    },
    img__hor_left: {
        left: -5
    }
}
