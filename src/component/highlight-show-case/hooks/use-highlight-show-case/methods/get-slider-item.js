

/**
 * Retrieves the selector for a slider item element based on its index.
 *
 * @param {number} index - The index of the slider item.
 * @returns {string} A string representing the CSS selector for the slider item element.
 */
function getSliderItem(index) {
    return `#slide-item-${index}`;
}

export default getSliderItem