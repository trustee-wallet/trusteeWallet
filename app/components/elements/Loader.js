/**
 * @version 0.43
 */
import React from 'react'
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'
import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { getIsLoaderVisible } from '@app/appstores/Stores/Main/selectors'

const MAX_TIME = 10000

class Loader extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            isCloseEnable: false
        }
        this.timeout = () => {
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.loaderVisibility) {
            if (!prevState.loaderVisibility) {
                this.timeout = setTimeout(() => {
                    this.setState({
                        isCloseEnable: true
                    })
                }, MAX_TIME)
            }
        } else {
            clearTimeout(this.timeout)
        }
    }

    handleClose = () => {
        setLoaderStatus(false)
    }

    render() {
        const { isCloseEnable } = this.state
        const { loaderVisibility } = this.props
        return loaderVisibility ? (
            <View style={styles.wrapper}>
                {
                    isCloseEnable ?
                        <TouchableOpacity style={{ position: 'absolute', top: 40, right: 0, padding: 20 }} onPress={this.handleClose}>
                            <MaterialCommunityIcons style={{ fontSize: 30 }} name='window-close' size={22} color={'#fff'} />
                        </TouchableOpacity> : null
                }
                {Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#fff' /> : <MaterialIndicator size={30} color='#fff' />}
            </View>
        ) : null
    }
}

const mapStateToProps = (state) => {
    return {
        loaderVisibility: getIsLoaderVisible(state)
    }
}

export default connect(mapStateToProps, {})(Loader)

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        backgroundColor: '#000',
        opacity: .5,
        overflow: 'hidden'
    }
})
