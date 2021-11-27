/**
 * @version 0.52
 * @author yura
 */
import React from 'react'
import { View } from 'react-native'

import GradientView from '@app/components/elements/GradientView'

import { ThemeContext } from '@app/theme/ThemeProvider'

class AccountGradientBlock extends React.PureComponent {

    state = {
        viewHeight: 0
    }

    processViewHeight = (e) => {
        this.setState({
            viewHeight: e.nativeEvent.layout.height
        })
    }

    render() {

        const {
            colors, GRID_SIZE
        } = this.context
        
        return (
            <View style={[styles.container, { minHeight: this.state.viewHeight + GRID_SIZE * 2 + 30 }]}>
                <GradientView
                    style={[styles.bg, { padding: GRID_SIZE, minHeight: this.state.viewHeight + 10 }]}
                    array={colors.accountScreen.containerBG}
                    start={styles.containerBG.start}
                    end={styles.containerBG.end}
                >
                    <View style={styles.content} onLayout={this.processViewHeight}>
                        {this.props.children}
                    </View>
                </GradientView>
                <View style={[styles.containerShadow, { minHeight: this.state.viewHeight + GRID_SIZE }]}>
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