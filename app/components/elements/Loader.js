import React, { Component } from 'react';
import { connect } from 'react-redux';

import OrientationLoadingOverlay from 'react-native-orientation-loading-overlay';

class Loader extends Component {

    constructor(props){
        super(props);
        this.state = {};
    }

    render() {
        const { loaderVisibility } = this.props.main;

        //console.log(loader)

        return (
            <OrientationLoadingOverlay
                    visible={loaderVisibility}
                    color="white"
                    indicatorSize="large">
            </OrientationLoadingOverlay>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        main: state.mainStore
    }
};

export default connect(mapStateToProps, {})(Loader);
