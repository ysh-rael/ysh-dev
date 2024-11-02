
/**
 * Retrieves the selector for a card element based on its index.
 *
 * @param {number} index - The index of the card.
 * @returns {string} A string representing the CSS selector for the card element.
 */
function getCard(index) {
    return `#card${index}`;
}

export default getCard
