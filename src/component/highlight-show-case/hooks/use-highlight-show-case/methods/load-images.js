/**
 * Loads all images specified in the `dataCards` array.
 *
 * @async
 * @returns {Promise<HTMLImageElement[]>} A promise that resolves to an array of loaded image elements.
 */
async function loadImages(){
    const promises = this.dataCards.map(({ image }) => this.loadImage(image));
    return Promise.all(promises);
}

export default loadImages