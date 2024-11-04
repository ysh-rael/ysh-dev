import { gsap } from "gsap";
import config from '../config';


/**
 * Initializes the showcase by setting positions, sizes, and animations for elements
 * based on the current order and window dimensions.
 *
 * This method configures the initial state of the cards, details, pagination,
 * and other UI elements using the GSAP animation library.
 *
 * @returns {void}
 */
function init() {
    const [active, ...rest] = this.order;
    const detailsActive = this.detailsEven ? "#details-even" : "#details-odd";
    const detailsInactive = this.detailsEven ? "#details-odd" : "#details-even";
    const { innerHeight: height, innerWidth: width } = window;

    this.offsetTop = height - 520;
    this.offsetLeft = width - 830;

    gsap.set("#pagination", config.gsap.pagination);
    gsap.set("nav", { y: 0, opacity: 0 });

    gsap.set(this.getCard(active), {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
    });
    gsap.set(this.getCardContent(active), { x: 0, y: 0, opacity: 0 });
    gsap.set(detailsActive, { opacity: 0, zIndex: 2.2, x: -200 });
    gsap.set(detailsInactive, { opacity: 0, zIndex: 1.2 });
    gsap.set(`${detailsInactive} .text`, { y: 100 });
    gsap.set(`${detailsInactive} .title-1`, { y: 100 });
    gsap.set(`${detailsInactive} .title-2`, { y: 100 });
    gsap.set(`${detailsInactive} .desc`, { y: 50 });
    gsap.set(`${detailsInactive} .cta`, { y: 60 });

    gsap.set(".progress-sub-foreground", {
        width: 280 * (1 / this.order.length) * (active + 1),
    });

    rest.forEach((i, index) => {
        gsap.set(this.getCard(i), {
            x: this.offsetLeft + 400 + index * (this.cardWidth + this.gap),
            y: this.offsetTop,
            width: this.cardWidth,
            height: this.cardHeight,
            zIndex: 3,
            borderRadius: 8,
        });
        gsap.set(this.getCardContent(i), {
            x: this.offsetLeft + 400 + index * (this.cardWidth + this.gap),
            zIndex: 4,
            y: this.offsetTop + this.cardHeight - 100,
        });
        gsap.set(this.getSliderItem(i), { x: (index + 1) * this.numberSize });
    });

    gsap.set(".indicator", { x: -window.innerWidth });

    const startDelay = 0.6;

    gsap.to(".cover", {
        x: width + 400,
        delay: 0.5,
        ease: this.ease,
        onComplete: () => {
            setTimeout(() => {
                this.loop();
            }, 4000);
        },
    });

    rest.forEach((i, index) => {
        gsap.to(this.getCard(i), {
            x: this.offsetLeft + index * (this.cardWidth + this.gap),
            zIndex: 3,
            delay: 0.05 * index,
            ease: this.ease,
            delay: startDelay,
        });
        gsap.to(this.getCardContent(i), {
            x: this.offsetLeft + index * (this.cardWidth + this.gap),
            zIndex: 4,
            delay: 0.05 * index,
            ease: this.ease,
            delay: startDelay,
        });
    });
    gsap.to("#pagination", { y: 0, opacity: 1, ease: this.ease, delay: startDelay });
    gsap.to("nav", { y: 0, opacity: 1, ease: this.ease, delay: startDelay });
    gsap.to(detailsActive, { opacity: 1, x: 0, ease: this.ease, delay: startDelay });
}

export default init
