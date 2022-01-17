/**
 * @version 0.53
 * @author yura
 */

import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'

import { ThemeContext } from '@app/theme/ThemeProvider'
import CustomBackground from './SheetBottomBackground'
import CustomHandle from './SheetBottomHandle'

class SheetBottom extends PureComponent {

    sheetBottomRef = React.createRef()

    close = () => {
        this.sheetBottomRef.close()
    }

    open = () => {
        this.sheetBottomRef.snapTo(1)
    }

    renderCustomBackdrop = (props) => {
        return (
            <BottomSheetBackdrop
                {...props}
                enableTouchThrough
            />
        );
    };

    render() {
        return (
            <BottomSheet
                ref={ref => this.sheetBottomRef = ref}
                backdropComponent={this.renderCustomBackdrop}
                backgroundComponent={CustomBackground}
                handleComponent={CustomHandle}
                enableContentPanningGesture
                enableHandlePanningGesture
                enablePanDownToClose
                {...this.props}
            >
                {this.props.children}
            </BottomSheet>
        )
    }

}

SheetBottom.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SheetBottom)