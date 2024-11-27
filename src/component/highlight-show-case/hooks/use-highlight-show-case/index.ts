import loadImage from "./methods/load-image";
import start from "./methods/start";
import loadImages from "./methods/load-images";
import init from "./methods/init";
import getCard from "./methods/get-card";
import getCardContent from "./methods/get-content-card";
import getSliderItem from "./methods/get-slider-item";
import loop from "./methods/loop";
import step from "./methods/step";
import animate from "./methods/animate";
import getElementById from "./methods/get-element-by-id";

/**
 * Controls the display and animation of a showcase of highlight cards.
 */
class UseHighlightShowcase {
    dataCards: any[];
    order: number[];
    detailsEven: boolean;
    offsetTop: number;
    offsetLeft: number;
    cardWidth: number;
    cardHeight: number;
    gap: number;
    numberSize: number;
    ease: string;
    clicks: number;
    skipStep: boolean;

    /**
     * Initializes a new instance of the UseHighlightShowcase.
     *
     * @param {any[]} dataCards - The array of data to be used for each card in the showcase.
     * @param {number[]} [order] - Optional array specifying the order in which cards should appear.
     */
    constructor(dataCards: any[], order?: number[]) {
        this.dataCards = dataCards;
        this.order = order || dataCards.map((getElementById, i) => i);
        this.detailsEven = true;
        this.skipStep = false;
        this.offsetTop = 200;
        this.offsetLeft = 400;
        this.cardWidth = 200;
        this.cardHeight = 280;
        this.gap = 40;
        this.numberSize = 50;
        this.ease = "sine.inOut";
        this.clicks = 0;
    }

    /**
     * Loads an individual image and returns a promise that resolves with the image element.
     *
     * @param {string} src - The URL of the image to load.
     * @returns {Promise<HTMLImageElement>} A promise that resolves to the loaded image element.
     */
    loadImage = loadImage.bind(this);

    /**
     * Loads all images required for the data cards.
     *
     * @returns {Promise<HTMLImageElement[]>} A promise that resolves to an array of loaded image elements.
     */
    loadImages = loadImages.bind(this);

    /**
     * Starts the animation or display of the showcase.
     */
    start = start.bind(this);

    /**
     * Initializes the showcase and prepares all elements.
     */
    init = init.bind(this);

    /**
     * Retrieves a specific card based on the provided index.
     *
     * @param {number} index - The index of the card to retrieve.
     * @returns {HTMLElement} The HTML element of the card.
     */
    getCard = getCard.bind(this);

    /**
     * Gets the content of a specific card by index.
     *
     * @param {number} index - The index of the card content to retrieve.
     * @returns {any} The content associated with the specified card.
     */
    getCardContent = getCardContent.bind(this);

    /**
     * Retrieves an item from the slider by index.
     *
     * @param {number} index - The index of the slider item.
     * @returns {HTMLElement} The HTML element of the slider item.
     */
    getSliderItem = getSliderItem.bind(this);

    /**
     * Main loop for handling continuous animations or updates in the showcase.
     */
    loop = loop.bind(this);

    /**
     * Executes a single step in the animation or update process.
     */
    step = step.bind(this);

    /**
     * Animates the transition or movement of elements in the showcase.
     *
     * @param {HTMLElement} element - The element to animate.
     * @param {object} properties - The properties to animate with their target values.
     * @param {number} duration - The duration of the animation in milliseconds.
     * @returns {Promise<void>} A promise that resolves once the animation completes.
     */
    animate = animate.bind(this);

    /**
     * Binds an underscore function to the context of the controller.
     */
    getElementById = getElementById.bind(this);
}


export default UseHighlightShowcase;
