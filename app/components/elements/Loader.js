import React, { Component } from 'react'
import { Platform, View } from 'react-native'
import { connect } from 'react-redux'
import { MaterialIndicator, UIActivityIndicator } from 'react-native-indicators'

class Loader extends Component {

    constructor(props){
        super(props)
        this.state = {}
    }

    render() {

        const { loaderVisibility } = this.props.main

        return (
            <View style={{ alignItems: "center", justifyContent: "center", position: "absolute", top: 0, left: 0, height: !loaderVisibility ? 0 : "100%", width: !loaderVisibility ? 0 : "100%", backgroundColor: "#000", opacity: .5, overflow: "hidden" }}>
                { Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#fff' /> : <MaterialIndicator size={30} color='#fff' /> }
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        main: state.mainStore
    }
}

export default connect(mapStateToProps, {})(Loader)
