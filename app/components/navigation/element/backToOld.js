import * as React from "react"
import Svg, { Path } from "react-native-svg"
import OldPhone from '../../../services/UI/OldPhone/OldPhone'
import { Image, View } from "react-native"

function BackToOld() {
    if (OldPhone.isOldPhone()) {
        return (
            <View>
                <Image
                    style={{ width: 18, height: 18}}
                    resizeMode='stretch'
                    source={require('../../../assets/images/backToOld.png')}/>
            </View>
        )
    }
    return (
        <View>
            <Svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="18px" height="18px" viewBox="0 0 18 18" enableBackground="new 0 0 18 18">
                <Path fill="#404040" d="M18,9c0,0.203-0.079,0.392-0.222,0.533c-0.141,0.14-0.329,0.218-0.53,0.218c-0.003,0-0.005,0-0.007,0H5.98 l2.01,2.009c0.295,0.296,0.295,0.776,0,1.072c-0.14,0.139-0.335,0.22-0.533,0.22c-0.198,0-0.392-0.081-0.533-0.22L3.622,9.53 c-0.14-0.14-0.22-0.335-0.22-0.534s0.08-0.393,0.22-0.533l3.302-3.302c0.286-0.287,0.786-0.286,1.071,0 c0.295,0.295,0.295,0.775,0,1.07L5.983,8.243h11.263C17.662,8.243,18,8.582,18,9z M16.891,11.21c-0.418,0-0.758,0.339-0.758,0.755 v2.067c0,1.256-1.021,2.278-2.277,2.278H3.793c-1.256,0-2.278-1.022-2.278-2.278V3.967c0-1.256,1.022-2.278,2.278-2.278h10.062 c1.256,0,2.277,1.022,2.277,2.278V6.01c0,0.418,0.34,0.757,0.758,0.757c0.416,0,0.755-0.34,0.755-0.757V3.967 c0-2.09-1.7-3.79-3.79-3.79H3.793C1.702,0.177,0,1.878,0,3.967v10.062c0,2.091,1.702,3.793,3.793,3.793h10.062 c2.09,0,3.79-1.7,3.79-3.79v-2.067C17.646,11.549,17.307,11.21,16.891,11.21z"/>
            </Svg>
        </View >
    )
}

export default BackToOld