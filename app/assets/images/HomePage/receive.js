import React from 'react'
import Svg, { Path, Line } from 'react-native-svg'
import { Image } from 'react-native'

function SvgComponent(props) {
    const color = props.color || '#F7F7F7';
    return (
        <Svg width={14} height={16} viewBox="0 0 14 16">
            <Path
                fill={color}
                stroke={color}
                d="M2.96211 9.22189L11.0453 9.22189C11.2932 9.22189 11.4939 9.03372 11.4939 8.80118C11.4939 8.56864 11.2932 8.38047 11.0453 8.38047H4.04505L11.3541 1.52603C11.5293 1.36169 11.5293 1.09546 11.3541 0.931152C11.2665 0.848997 11.1516 0.8079 11.0369 0.8079C10.9221 0.8079 10.8073 0.848997 10.7197 0.931152L3.41072 7.78558L3.41072 1.22069C3.41072 0.988143 3.21007 0.799973 2.96211 0.799973C2.71414 0.799973 2.5135 0.988143 2.5135 1.22069L2.5135 8.80118C2.5135 9.03372 2.71414 9.22189 2.96211 9.22189Z"
            />
            <Line
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                x1="1.54541"
                y1="14.3636"
                x2="12.4545"
                y2="14.3636"
            />
        </Svg>
    )
}

export default SvgComponent
