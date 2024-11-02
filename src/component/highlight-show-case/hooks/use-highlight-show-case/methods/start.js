/**
 * Starts the loading process for images and initializes the controller.
 *
 * @returns {Promise<void>} A promise that resolves when the loading is complete and the controller is initialized.
 */
async function start() {
    try {
        await this.loadImages(); // Carrega as imagens
        this.init(); // Inicializa o controlador
    } catch (error) {
        console.error("One or more images failed to load", error);
    }
}

export default start;
