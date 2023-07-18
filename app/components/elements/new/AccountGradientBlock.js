/**
 * @version 0.53
 * @author yura
 */
import React from 'react'
import { View } from 'react-native'

import GradientView from '@app/components/elements/GradientView'

import { ThemeContext } from '@app/theme/ThemeProvider'
import Log from '@app/services/Log/Log'

let CACHE_HEIGHT = 0

class AccountGradientBlock extends React.PureComponent {

    state = {
        viewHeight: 0
    }

    componentDidMount() {
        if (this.props.cleanCache) {
            CACHE_HEIGHT = 0
        }
    }

    processViewHeight = (e) => {
        if (this.props.height) return
        const height = e.nativeEvent.layout.height
        CACHE_HEIGHT = height > 0 ? height : CACHE_HEIGHT
        this.setState({
            viewHeight: height
        })
    }

    render() {

        const {
            colors, GRID_SIZE
        } = this.context

        return (
            <View style={[styles.container, { height: (this.props.height || CACHE_HEIGHT) + GRID_SIZE * 2 + 30 }]}>
                <GradientView
                    style={[styles.bg, { padding: GRID_SIZE, minHeight: (this.props.height || CACHE_HEIGHT) + 10 }]}
                    array={colors.accountScreen.containerBG}
                    start={styles.containerBG.start}
                    end={styles.containerBG.end}
                >
                    <View style={styles.content} onLayout={this.processViewHeight}>
                        {this.props.children}
                    </View>
                </GradientView>
                <View style={[styles.containerShadow, { height: (this.props.height || CACHE_HEIGHT) + GRID_SIZE * 1.35 }]}>
                    <View style={[styles.shadow, { backgroundColor: colors.accountScreen.headBlockBackground }]} />
                </View>
            </View>
        )
    }
}

AccountGradientBlock.contextType = ThemeContext

export default AccountGradientBlock

const styles = {
    bg: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        zIndex: 1,

        borderRadius: 16,
        height: 'auto'
    },
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    containerShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        borderRadius: 16,
        zIndex: 0,
        height: 'auto'
    },
    shadow: {
        marginTop: 10,
        marginHorizontal: 5,

        height: '100%',
        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    },
    container: {
        position: 'relative',
        borderRadius: 16,
        height: 'auto'
    },

    content: {
        flex: 1,
        position: 'relative',
        zIndex: 2,
    }
}
