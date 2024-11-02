import { gsap } from "gsap";

/**
 * Animates a target element using GSAP.
 *
 * This function creates a promise that resolves when the animation is complete.
 *
 * @param {string|HTMLElement} target - The target element(s) to animate. This can be a CSS selector string or a reference to a DOM element.
 * @param {number} duration - The duration of the animation in seconds.
 * @param {Object} properties - The properties to animate. This object can contain any valid GSAP properties (e.g., x, y, opacity).
 * @returns {Promise<void>} A promise that resolves when the animation completes.
 */
function animate(target, duration, properties) {
    return new Promise((resolve) => {
        gsap.to(target, {
            ...properties,
            duration: duration,
            onComplete: resolve,
        });
    });
}

export default animate
