
/**
 * @version 0.54
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet
} from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { ThemeContext } from '@app/theme/ThemeProvider'

class ScrollingList extends React.PureComponent {

    state = {
        localIndex: 0
    }

    componentDidUpdate(_, prevState) {
        if (prevState.localIndex !== this.state.localIndex) {
            this.flatlistRef.scrollToIndex({
                index: this.state.localIndex,
                animated: true,
                viewPosition: 0.4
            })
        }
    }

    onPress = (index) => {
        this.setState({
            localIndex: index
        })

        this.props.onPress && this.props.onPress(index)
    }

    renderListItem = ({ item, index }) => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        const {
            active
        } = this.props

        const margin = index === 0

        const inverse = index === active

        return (
            <TouchableOpacity
                onPress={() => this.onPress(index)}
                disabled={inverse}
                style={[styles.button, {
                    marginRight: GRID_SIZE,
                    marginLeft: margin ? GRID_SIZE : 0,
                    backgroundColor: inverse ? colors.common.text1 : colors.common.button.disabledBg + '66',
                    borderColor: inverse ? '' : colors.common.text1,
                    borderWidth: inverse ? 0 : 2,
                    paddingHorizontal: inverse ? 14 : 12,
                }]}
            >
                <Text style={{ ...styles.text, color: inverse ? colors.common.background : colors.common.text3 }} >{item.networkTitle}</Text>
            </TouchableOpacity>
        )
    }

    render() {

        const { GRID_SIZE } = this.context

        const { data } = this.props

        return (
            <View style={{ marginVertical: GRID_SIZE }}>
                <FlatList
                    ref={ref => this.flatlistRef = ref}
                    data={data}
                    horizontal
                    keyExtractor={({ index }) => index}
                    renderItem={this.renderListItem}
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={this.state.localIndex}
                />
            </View>
        )
    }
}

export default ScrollingList

ScrollingList.contextType = ThemeContext

const styles = StyleSheet.create({
    button: {
        width: 'auto',
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 10,
        letterSpacing: 0.5,
        textAlign: 'center',
        textTransform: 'uppercase',
        color: '#5C5C5C'
    }
})
