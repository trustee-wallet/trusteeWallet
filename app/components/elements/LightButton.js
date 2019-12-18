import React, { Component } from 'react'
import { Image, Text, View } from 'react-native'

export default class LightButton extends Component {
    render(){

        const { title, Icon, iconStyle } = this.props

        return (
            <View style={styles.button__content}>
                <Icon style={{...styles.button_icon, ...iconStyle}} />
                <Text style={styles.button__text}>
                    { title }
                </Text>
                <Image
                    style={[styles.img__hor, styles.img__hor_right]}
                    resizeMode={'stretch'}
                    source={styles.img__paths.right}
                />
                <Image
                    style={[styles.img__hor, styles.img__hor_left]}
                    resizeMode={'stretch'}
                    source={styles.img__paths.left}
                />
                <Image
                    style={[styles.img__ver]}
                    resizeMode={'stretch'}
                    source={styles.img__paths.line}
                />
            </View>
        )
    }
}

const styles = {
    button__content: {
        position: "relative",

        flexDirection: "row",
        alignItems: "center",

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderColor: '#864DD9',
        borderWidth: 1.5
    },
    button__text: {
        fontSize: 10,
        color: '#864DD9',
        fontFamily: "Montserrat-Bold",
    },
    button_icon: {
        marginTop: 1,

        color: '#864DD9'
    },
    img__paths: {
        left: require('../../assets/images/addAssetborderShadowLeft.png'),
        right: require('../../assets/images/addAssetborderShadowRight.png'),
        line: require('../../assets/images/addAssetborderShadowLines.png')
    },
    img__ver: {
        flex: 1,

        position: "absolute",
        top: -6,
        left: 5,

        width: "103%",
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor: {
        flex: 1,

        position: "absolute",
        top: -6,

        width: 10,
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor_right: {
        right: -5,
    },
    img__hor_left: {
        left: -5,
    },
}