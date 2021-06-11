/**
 * @version 0.43
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { BoxShadow } from 'react-native-shadow'

class Circle extends React.PureComponent {

    render() {

        const { width, height, border, backgroundColor, backgroundInnerColor } = this.props.style

        return (
            <View style={[styles.circle, { top: -(width / 6), width, height }]}>
                <View style={styles.circle_itm}>
                    {/* <BoxShadow setting={{ ...styles.circle__item, width, height, radius: width / 2, color: backgroundColor, backgroundColor }}> */}
                    <View style={[styles.circle__item__inner, { backgroundColor }]}>
                        <View style={[styles.circle__item__transparent, { width: width - border, height: height - border, backgroundColor: backgroundInnerColor }]}>
                            {this.props.children ? this.props.children : null}
                        </View>
                    </View>
                    {/* </BoxShadow> */}
                </View>
            </View>
        )
    }
}

export default Circle


const styles = {
    circle: {
        position: 'relative',
        top: -2,

        width: 10,
        height: 10,
        borderRadius: 50,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
    },
    circle_itm: {
        marginVertical: 5,
    },
    circle__item: {
        width: 10,
        height: 10,
        color: '#F59E6C',
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
    circle__item__inner: {
        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',
        height: '100%',
        backgroundColor: '#F59E6C',
        borderRadius: 50
    },
    circle__item__transparent: {
        alignItems: 'center',
        justifyContent: 'center',

        borderRadius: 50
    }
}
