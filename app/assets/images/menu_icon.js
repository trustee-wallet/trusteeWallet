import React from 'react'
import Svg, { Path } from 'react-native-svg'
import OldPhone from '../../services/UI/OldPhone/OldPhone'
import { Image } from 'react-native'

function SvgComponent(props) {
    if (OldPhone.isOldPhone()) {
        return (
            <Image
                width={18}
                height={18}
                resizeMode='stretch'
                source={require('./menu_icon.png')}/>
        )
    }
    const color = '#404040';
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18" {...props}>
            <Path
                fill={color}
                d="M1.788 1.2887C1.35375 1.2887 0.999939 1.64251 0.999939 2.07676C0.999939 2.51101 1.35375 2.86482 1.788 2.86482L17.4806 2.86482C17.9149 2.86482 18.2681 2.51101 18.2681 2.07676C18.2681 1.64251 17.9149 1.2887 17.4806 1.2887L1.788 1.2887Z"
            />
            <Path
                fill={color}
                d="M7.788 8.21198C7.35375 8.21198 6.99994 8.56579 6.99994 9.00004C6.99994 9.43485 7.35375 9.7881 7.788 9.7881L17.0192 9.7881C17.4534 9.7881 17.8067 9.43485 17.8067 9.00004C17.8067 8.56579 17.4534 8.21198 17.0192 8.21198L7.788 8.21198Z"
            />
            <Path
                fill={color}
                d="M12.2738 15.1352C12.1229 15.1352 11.9999 15.5657 11.9999 15.9999C11.9999 16.4342 12.1229 16.7108 12.2738 16.7108H17.7263C17.8772 16.7108 17.9999 16.3569 17.9999 15.9227C17.9999 15.4884 17.8772 15.1352 17.7263 15.1352L12.2738 15.1352Z"
            />
        </Svg>
    )
}

export default SvgComponent

