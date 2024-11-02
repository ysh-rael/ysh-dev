import { gsap } from "gsap";

/**
 * Updates the card order and animates the transition to the next active card.
 *
 * This function shifts the order of the cards, updates the details of the 
 * active card, and performs various GSAP animations to smoothly transition 
 * between cards. It resolves a promise when the animations are complete.
 *
 * @returns {Promise<void>} A promise that resolves when the step animation is complete.
 */
function step() {
    return new Promise((resolve) => {
        this.order.push(this.order.shift());
        this.detailsEven = !this.detailsEven;

        const [active, ...rest] = this.order;
        const detailsActive = this.detailsEven ? "#details-even" : "#details-odd";
        const detailsInactive = this.detailsEven ? "#details-odd" : "#details-even";

        // Atualizando os detalhes do cartão ativo
        document.querySelector(`${detailsActive} .place-box .text`).textContent =
            this.dataCards[this.order[0]].place;
        document.querySelector(`${detailsActive} .title-1`).textContent =
            this.dataCards[this.order[0]].title;
        document.querySelector(`${detailsActive} .title-2`).textContent =
            this.dataCards[this.order[0]].title2;
        document.querySelector(`${detailsActive} .desc`).textContent =
            this.dataCards[this.order[0]].description;

        // Configurando animações GSAP
        gsap.set(detailsActive, { zIndex: 2.2 });
        gsap.to(detailsActive, { opacity: 1, delay: 0.4, ease: this.ease });
        gsap.to(`${detailsActive} .text`, { y: 0, delay: 0.1, duration: 0.7, ease: this.ease });
        gsap.to(`${detailsActive} .title-1`, { y: 0, delay: 0.15, duration: 0.7, ease: this.ease });
        gsap.to(`${detailsActive} .title-2`, { y: 0, delay: 0.15, duration: 0.7, ease: this.ease });
        gsap.to(`${detailsActive} .desc`, { y: 0, delay: 0.3, duration: 0.4, ease: this.ease });
        gsap.to(`${detailsActive} .cta`, {
            y: 0,
            delay: 0.35,
            duration: 0.4,
            onComplete: resolve,
            ease: this.ease,
        });
        gsap.set(detailsInactive, { zIndex: 1.2 });

        const prv = rest[rest.length - 1];

        // Atualizando cartões ativos e anteriores
        gsap.set(this.getCard(prv), { zIndex: 1 });
        gsap.set(this.getCard(active), { zIndex: 2 });
        gsap.to(this.getCard(prv), { scale: 1.5, ease: this.ease });

        gsap.to(this.getCardContent(active), {
            y: this.offsetTop + this.cardHeight - 10,
            opacity: 0,
            duration: 0.3,
            ease: this.ease,
        });
        gsap.to(this.getSliderItem(active), { x: 0, ease: this.ease });
        gsap.to(this.getSliderItem(prv), { x: -this.numberSize, ease: this.ease });
        gsap.to(".progress-sub-foreground", {
            width: 280 * (1 / this.order.length) * (active + 1),
            ease: this.ease,
        });

        // Definindo animações para o cartão ativo
        gsap.to(this.getCard(active), {
            x: 0,
            y: 0,
            ease: this.ease,
            width: window.innerWidth,
            height: window.innerHeight,
            borderRadius: 0,
            onComplete: () => {
                const xNew = this.offsetLeft + (rest.length - 1) * (this.cardWidth + this.gap);
                gsap.set(this.getCard(prv), {
                    x: xNew,
                    y: this.offsetTop,
                    width: this.cardWidth,
                    height: this.cardHeight,
                    zIndex: 3,
                    borderRadius: 0,
                    scale: 1,
                });

                gsap.set(this.getCardContent(prv), {
                    x: xNew,
                    y: this.offsetTop + this.cardHeight - 100,
                    opacity: 1,
                    zIndex: 4,
                });
                gsap.set(this.getSliderItem(prv), { x: rest.length * this.numberSize });

                gsap.set(detailsInactive, { opacity: 0 });
                gsap.set(`${detailsInactive} .text`, { y: 100 });
                gsap.set(`${detailsInactive} .title-1`, { y: 100 });
                gsap.set(`${detailsInactive} .title-2`, { y: 100 });
                gsap.set(`${detailsInactive} .desc`, { y: 50 });
                gsap.set(`${detailsInactive} .cta`, { y: 60 });
                this.clicks -= 1;
                if (this.clicks > 0) {
                    this.step();
                }
            },
        });

        // Atualizando a posição dos cartões restantes
        rest.forEach((i, index) => {
            if (i !== prv) {
                const xNew = this.offsetLeft + index * (this.cardWidth + this.gap);
                gsap.set(this.getCard(i), { zIndex: 3 });
                gsap.to(this.getCard(i), {
                    x: xNew,
                    y: this.offsetTop,
                    width: this.cardWidth,
                    height: this.cardHeight,
                    ease: this.ease,
                    delay: 0.1 * (index + 1),
                });

                gsap.to(this.getCardContent(i), {
                    x: xNew,
                    y: this.offsetTop + this.cardHeight - 100,
                    opacity: 1,
                    zIndex: 4,
                    ease: this.ease,
                    delay: 0.1 * (index + 1),
                });
                gsap.to(this.getSliderItem(i), { x: (index + 1) * this.numberSize, ease: this.ease });
            }
        });
    });
}

export default step
