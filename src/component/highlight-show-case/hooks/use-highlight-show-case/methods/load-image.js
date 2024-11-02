/**
 * Loads an image from a given source URL.
 *
 * @param {string} src - The URL of the image to load.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image element or rejects if loading fails.
 */
function loadImage(src){
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export default loadImage