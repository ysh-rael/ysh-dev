/**
 * Retrieves the selector for the content of a card element based on its index.
 *
 * @param {number} index - The index of the card.
 * @returns {string} A string representing the CSS selector for the card content element.
 */
function getCardContent(index) {
    return `#card-content-${index}`;
}

export default getCardContent