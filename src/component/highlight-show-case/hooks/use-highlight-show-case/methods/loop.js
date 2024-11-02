import { gsap } from "gsap";

/**
 * Continuously animates the indicator element in a loop.
 *
 * This function first animates the indicator into view, then animates it out 
 * of view, resets its position, and calls the `step` method before calling 
 * itself again to create a looping animation effect.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the animation loop is complete.
 */
async function loop() {
    await this.animate(".indicator", 2, { x: 0 });
    await this.animate(".indicator", 0.8, { x: window.innerWidth, delay: 0.3 });
    gsap.set(".indicator", { x: -window.innerWidth });
    await this.step();
    this.loop();
}

export default loop