import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { Image } from 'react-native'

function SvgComponent(props) {
    const color = props.color || '#F7F7F7';
    return (
        <Svg width={12} height={4} viewBox="0 0 12 4">
            <Path
                fill={color}
                stroke={color}
                d="M10.3316 1.33398H1.60253C1.20091 1.33398 0.936523 1.59833 0.936523 1.99994C0.936523 2.40159 1.20087 2.66589 1.60253 2.66589H10.3316C10.7332 2.66589 10.9976 2.40155 10.9976 1.99994C10.9975 1.59833 10.7332 1.33398 10.3316 1.33398Z"
            />
        </Svg>
    )
}

export default SvgComponent
