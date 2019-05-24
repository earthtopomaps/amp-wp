/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './edit.css';
import {
	getResizedWidthAndHeight,
	getPercentageFromPixels,
	getPixelsFromPercentage,
	getBlockPositioning,
	getRadianFromDeg,
} from '../../stories-editor/helpers';

import { BLOCKS_WITH_TEXT_SETTINGS } from '../../stories-editor/constants';

let lastSeenX = 0,
	lastSeenY = 0,
	blockElement = null,
	blockElementTop,
	blockElementLeft,
	imageWrapper,
	textElement;

export default ( props ) => {
	const {
		isSelected,
		angle,
		blockName,
		ampFitText,
		minWidth,
		minHeight,
		onResizeStart,
		onResizeStop,
		children,
		...otherProps
	} = props;

	let {
		width,
		height,
	} = props;

	const isImage = 'core/image' === blockName;
	const isBlockWithText = BLOCKS_WITH_TEXT_SETTINGS.includes( blockName );

	return (
		<ResizableBox
			{ ...otherProps }
			className={ classnames(
				'amp-story-resize-container',
				{ 'is-selected': isSelected }
			) }
			size={ {
				height,
				width,
			} }
			// Adding only right and bottom since otherwise it needs to change the top and left position, too.
			enable={ {
				top: false,
				right: true,
				bottom: true,
				left: false,
			} }
			onResizeStop={ ( event, direction ) => {
				const { deltaW, deltaH } = getResizedWidthAndHeight( event, angle, lastSeenX, lastSeenY, direction );
				const appliedWidth = width + deltaW;
				const appliedHeight = height + deltaH;

				if ( textElement ) {
					// Check the element's scrollWidth and scrollHeight.
					// If any of these is getting over the limit then we should prevent resizing.
					if ( appliedWidth < textElement.scrollWidth || appliedHeight < textElement.scrollHeight ) {
						return;
					}
				}

				onResizeStop( {
					width: parseInt( appliedWidth, 10 ),
					height: parseInt( appliedHeight, 10 ),
					positionTop: parseInt( blockElement.style.top, 10 ),
					positionLeft: parseInt( blockElement.style.left, 10 ),
				} );
			} }
			onResizeStart={ ( event, direction, element ) => {
				lastSeenX = event.clientX;
				lastSeenY = event.clientY;
				blockElement = element.closest( '.wp-block' );
				blockElementTop = blockElement.style.top;
				blockElementLeft = blockElement.style.left;
				if ( isImage ) {
					imageWrapper = blockElement.querySelector( 'figure .components-resizable-box__container' );
				}
				if ( isBlockWithText && ! ampFitText ) {
					switch ( blockName ) {
						case 'amp/amp-story-text':
							textElement = blockElement.querySelector( '.block-editor-rich-text__editable.editor-rich-text__editable' );
							break;
						case 'amp/amp-story-post-title':
							textElement = blockElement.querySelector( '.wp-block-amp-amp-story-post-title' );
							break;
						case 'amp/amp-story-post-author':
							textElement = blockElement.querySelector( '.wp-block-amp-amp-story-post-author' );
							break;
						case 'amp/amp-story-post-date':
							textElement = blockElement.querySelector( '.wp-block-amp-amp-story-post-date' );
							break;
					}
				}

				onResizeStart();
			} }
			onResize={ ( event, direction, element ) => {
				const { deltaW, deltaH } = getResizedWidthAndHeight( event, angle, lastSeenX, lastSeenY, direction );

				// Handle case where media is inserted from URL.
				if ( isImage && ! width && ! height ) {
					width = blockElement.clientWidth;
					height = blockElement.clientHeight;
				}
				const appliedWidth = minWidth <= width + deltaW ? width + deltaW : minWidth;
				const appliedHeight = minHeight <= height + deltaH ? height + deltaH : minHeight;

				if ( angle ) {
					const radianAngle = getRadianFromDeg( angle );

					// Compare position between the initial and after resizing.
					const initialPosition = getBlockPositioning( width, height, radianAngle );
					const resizedPosition = getBlockPositioning( appliedWidth, appliedHeight, radianAngle );
					const diff = {
						left: resizedPosition.left - initialPosition.left,
						top: resizedPosition.top - initialPosition.top,
					};
					// Get new position based on the difference.
					const originalPos = {
						left: getPixelsFromPercentage( 'x', parseInt( blockElementLeft, 10 ) ),
						top: getPixelsFromPercentage( 'y', parseInt( blockElementTop, 10 ) ),
					};

					// @todo Figure out why calculating the new top / left position doesn't work in case of small height value.
					// @todo Remove this temporary fix.
					if ( appliedHeight < 60 ) {
						diff.left = diff.left / ( 60 / appliedHeight );
						diff.right = diff.right / ( 60 / appliedHeight );
					}

					const updatedPos = {
						left: originalPos.left - diff.left,
						top: originalPos.top + diff.top,
					};

					blockElement.style.left = getPercentageFromPixels( 'x', updatedPos.left ) + '%';
					blockElement.style.top = getPercentageFromPixels( 'y', updatedPos.top ) + '%';
				}

				element.style.width = appliedWidth + 'px';
				element.style.height = appliedHeight + 'px';
				// If it's image, let's change the width and height of the image, too.
				if ( imageWrapper && isImage ) {
					imageWrapper.style.width = appliedWidth + 'px';
					imageWrapper.style.height = appliedHeight + 'px';
				}
			} }
		>
			{ children }
		</ResizableBox>
	);
};
