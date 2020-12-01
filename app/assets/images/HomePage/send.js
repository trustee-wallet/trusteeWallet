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
                d="M11.9917 0.809235H3.90857C3.66061 0.809235 3.45996 0.997404 3.45996 1.22994C3.45996 1.46248 3.66061 1.65065 3.90857 1.65065H10.9088L3.5998 8.50499C3.42455 8.66934 3.42455 8.93556 3.5998 9.09987C3.6874 9.18202 3.80221 9.22312 3.91698 9.22312C4.03176 9.22312 4.14653 9.18202 4.23417 9.09987L11.5431 2.24553V8.81034C11.5431 9.04288 11.7438 9.23105 11.9917 9.23105C12.2397 9.23105 12.4404 9.04288 12.4404 8.81034V1.22994C12.4404 0.997404 12.2397 0.809235 11.9917 0.809235Z"
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
