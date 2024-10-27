let order = [0, 1, 2, 3, 4, 5];
let detailsEven = true;

let offsetTop = 200;
let offsetLeft = 400;
let cardWidth = 200;
let cardHeight = 280;
let gap = 40;
let numberSize = 50;
const ease = "sine.inOut";


const config = {
    gsap: {
        pagination: {
            top: offsetTop + cardHeight + 8,
            left: offsetLeft,
            y: 0,
            opacity: 0,
            zIndex: 6,
        },
        nav: { y: 0, opacity: 0 },
        cardActive: () => ({
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
        }),
        getCardContentActive: { x: 0, y: 0, opacity: 0 },
        detailsActive: { opacity: 0, zIndex: 2.2, x: -200 },
        detailsInactive: { opacity: 0, zIndex: 1.2 },
        detailsInactiveText: { y: 100 },
        detailsInactiveText1: { y: 100 },
        detailsInactiveText2: { y: 100 },
        detailsInactiveDesc: { y: 100 },
        detailsInactiveCta: { y: 100 },
        cardI: index => ({
            x: offsetLeft + 400 + index * (cardWidth + gap),
            y: offsetTop,
            width: cardWidth,
            height: cardHeight,
            zIndex: 3,
            borderRadius: 4,
        }),
        cardContentI: index => ({
            x: offsetLeft + 400 + index * (cardWidth + gap),
            zIndex: 4,
            y: offsetTop + cardHeight - 100,
        }),
        sliderItemI: index => ({ x: (index + 1) * numberSize }),
        indicator: () => ({ x: -window.innerWidth })

    }
}

export default config