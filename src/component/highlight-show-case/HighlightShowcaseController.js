// HighlightShowcaseController.js

import { gsap } from "gsap";
import config from './config';

class HighlightShowcaseController {
    constructor(dataCards, order) {


        this.dataCards = dataCards
        this.order = order || dataCards.map((_, i) => i);
        this.detailsEven = true;
        this.offsetTop = 200;
        this.offsetLeft = 400;
        this.cardWidth = 200;
        this.cardHeight = 280;
        this.gap = 40;
        this.numberSize = 50;
        this.ease = "sine.inOut";
        this.clicks = 0;
    }

    _(id) {
        return document.getElementById(id);
    }

    async start() {
        try {
            await this.loadImages();
            this.init();
        } catch (error) {
            console.error("One or more images failed to load", error);
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async loadImages() {
        const promises = this.dataCards.map(({ image }) => this.loadImage(image));
        return Promise.all(promises);
    }

    init() {
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
                }, 500);
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

    getCard(index) {
        return `#card${index}`;
    }

    getCardContent(index) {
        return `#card-content-${index}`;
    }

    getSliderItem(index) {
        return `#slide-item-${index}`;
    }

    async loop() {
        await this.animate(".indicator", 2, { x: 0 });
        await this.animate(".indicator", 0.8, { x: window.innerWidth, delay: 0.3 });
        gsap.set(".indicator", { x: -window.innerWidth });
        await this.step();
        this.loop();
    }

    step() {
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


    animate(target, duration, properties) {
        return new Promise((resolve) => {
            gsap.to(target, {
                ...properties,
                duration: duration,
                onComplete: resolve,
            });
        });
    }
}

export default HighlightShowcaseController;
