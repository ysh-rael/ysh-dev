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
    await this.animate(".indicator", 1.4, { x: 0, delay: 4.28 });
    await this.animate(".indicator", 1.4, { x: window.innerWidth, delay: 1.4 });
    gsap.set(".indicator", { x: -window.innerWidth });
    await this.step();
    this.loop();
}

export default loop