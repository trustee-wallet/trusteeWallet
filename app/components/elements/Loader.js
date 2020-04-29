/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'
import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

class Loader extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isCloseEnable: false
        }
        this.timeout = () => {}
    }

    // eslint-disable-next-line react/no-deprecated
    componentWillReceiveProps(nextProps) {
        if(nextProps.loaderVisibility !== this.props.loaderVisibility) {
            if(nextProps.loaderVisibility === true) {
                this.timeout = setTimeout(() => {
                    this.setState( {
                        isCloseEnable: true
                    })
                }, 10000)
            } else {
                clearTimeout(this.timeout)
                this.setState({
                    isCloseEnable: false
                })
            }
        }
    }

    handleClose = () => {
        setLoaderStatus(false)
        clearTimeout(this.timeout)
        this.setState({
            isCloseEnable: false
        })
    }

    render() {

        const { isCloseEnable } = this.state
        const { loaderVisibility } = this.props

        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, height: !loaderVisibility ? 0 : '100%', width: !loaderVisibility ? 0 : '100%', backgroundColor: '#000', opacity: .5, overflow: 'hidden' }}>
                {
                    isCloseEnable ?
                        <TouchableOpacity style={{ position: 'absolute', top: 40, right: 0, padding: 20 }} onPress={this.handleClose}>
                            <MaterialCommunityIcons style={{ fontSize: 30 }} name="window-close" size={22} color={'#fff'}/>
                        </TouchableOpacity> : null
                }
                {Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#fff'/> : <MaterialIndicator size={30} color='#fff'/>}
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        loaderVisibility: state.mainStore.loaderVisibility
    }
}

export default connect(mapStateToProps, {})(Loader)
