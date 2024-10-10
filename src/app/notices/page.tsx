


// @ts-nocheck
'use client'
import { useEffect } from 'react';
import './styles.css'
import { gsap } from "gsap";

export default function Notices() {


  useEffect(() => {
    const data = [
      {
        place: 'Switzerland Alps',
        title: 'SAINT',
        title2: 'ANTONIEN',
        description: 'Tucked away in the Switzerland Alps, Saint Antönien offers an idyllic retreat for those seeking tranquility and adventure alike. It\'s a hidden gem for backcountry skiing in winter and boasts lush trails for hiking and mountain biking during the warmer months.',
        image: 'https://assets.codepen.io/3685267/timed-cards-1.jpg'
      },
      {
        place: 'Japan Alps',
        title: 'NANGANO',
        title2: 'PREFECTURE',
        description: 'Nagano Prefecture, set within the majestic Japan Alps, is a cultural treasure trove with its historic shrines and temples, particularly the famous Zenkō-ji. The region is also a hotspot for skiing and snowboarding, offering some of the country\'s best powder.',
        image: 'https://assets.codepen.io/3685267/timed-cards-2.jpg'
      },
      {
        place: 'Sahara Desert - Morocco',
        title: 'MARRAKECH',
        title2: 'MEROUGA',
        description: 'The journey from the vibrant souks and palaces of Marrakech to the tranquil, starlit sands of Merzouga showcases the diverse splendor of Morocco. Camel treks and desert camps offer an unforgettable immersion into the nomadic way of life.',
        image: 'https://assets.codepen.io/3685267/timed-cards-3.jpg'
      },
      {
        place: 'Sierra Nevada - USA',
        title: 'YOSEMITE',
        title2: 'NATIONAL PARAK',
        description: 'Yosemite National Park is a showcase of the American wilderness, revered for its towering granite monoliths, ancient giant sequoias, and thundering waterfalls. The park offers year-round recreational activities, from rock climbing to serene valley walks.',
        image: 'https://assets.codepen.io/3685267/timed-cards-4.jpg'
      },
      {
        place: 'Tarifa - Spain',
        title: 'LOS LANCES',
        title2: 'BEACH',
        description: 'Los Lances Beach in Tarifa is a coastal paradise known for its consistent winds, making it a world-renowned spot for kitesurfing and windsurfing. The beach\'s long, sandy shores provide ample space for relaxation and sunbathing, with a vibrant atmosphere of beach bars and cafes.',
        image: 'https://assets.codepen.io/3685267/timed-cards-5.jpg'
      },
      {
        place: 'Cappadocia - Turkey',
        title: 'Göreme',
        title2: 'Valley',
        description: 'Göreme Valley in Cappadocia is a historical marvel set against a unique geological backdrop, where centuries of wind and water have sculpted the landscape into whimsical formations. The valley is also famous for its open-air museums, underground cities, and the enchanting experience of hot air ballooning.',
        image: 'https://assets.codepen.io/3685267/timed-cards-6.jpg'
      },
    ]

    const _ = id => document.getElementById(id)

    const cards = data.map((i, index) => `<div class="card" id="card${index}" style="background-image:url(${i.image})"  ></div>`).join('')

    const cardContents = data.map((i, index) => `<div class="card-content" id="card-content-${index}">
<div class="content-start"></div>
<div class="content-place">${i.place}</div>
<div class="content-title-1">${i.title}</div>
<div class="content-title-2">${i.title2}</div>

</div>`).join('')


    const sildeNumbers = data.map((_, index) => `<div class="item" id="slide-item-${index}" >${index + 1}</div>`).join('')
    if (_('demo')) _('demo').innerHTML = cards + cardContents
    if (_('slide-numbers')) _('slide-numbers').innerHTML = sildeNumbers

    const range = (n) =>
      Array(n)
        .fill(0)
        .map((i, j) => i + j);
    const set = gsap.set;

    function getCard(index) {
      return `#card${index}`;
    }
    function getCardContent(index) {
      return `#card-content-${index}`;
    }
    function getSliderItem(index) {
      return `#slide-item-${index}`;
    }

    function animate(target, duration, properties) {
      return new Promise((resolve) => {
        gsap.to(target, {
          ...properties,
          duration: duration,
          onComplete: resolve,
        });
      });
    }

    let order = [0, 1, 2, 3, 4, 5];
    let detailsEven = true;

    let offsetTop = 200;
    let offsetLeft = 400;
    let cardWidth = 200;
    let cardHeight = 280;
    let gap = 40;
    let numberSize = 50;
    const ease = "sine.inOut";

    function init() {
      const [active, ...rest] = order;
      const detailsActive = detailsEven ? "#details-even" : "#details-odd";
      const detailsInactive = detailsEven ? "#details-odd" : "#details-even";
      const { innerHeight: height, innerWidth: width } = window;
      offsetTop = height - 520;
      offsetLeft = width - 830;

      gsap.set("#pagination", {
        top: offsetTop + cardHeight + 8,
        left: offsetLeft,
        y: 0,
        opacity: 0,
        zIndex: 6,
      });
      gsap.set("nav", { y: 0, opacity: 0 });

      gsap.set(getCard(active), {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      gsap.set(getCardContent(active), { x: 0, y: 0, opacity: 0 });
      gsap.set(detailsActive, { opacity: 0, zIndex: 2.2, x: -200 });
      gsap.set(detailsInactive, { opacity: 0, zIndex: 1.2 });
      gsap.set(`${detailsInactive} .text`, { y: 100 });
      gsap.set(`${detailsInactive} .title-1`, { y: 100 });
      gsap.set(`${detailsInactive} .title-2`, { y: 100 });
      gsap.set(`${detailsInactive} .desc`, { y: 50 });
      gsap.set(`${detailsInactive} .cta`, { y: 60 });

      gsap.set(".progress-sub-foreground", {
        width: 280 * (1 / order.length) * (active + 1),
      });

      rest.forEach((i, index) => {
        gsap.set(getCard(i), {
          x: offsetLeft + 400 + index * (cardWidth + gap),
          y: offsetTop,
          width: cardWidth,
          height: cardHeight,
          zIndex: 3,
          borderRadius: 0,
        });
        gsap.set(getCardContent(i), {
          x: offsetLeft + 400 + index * (cardWidth + gap),
          zIndex: 4,
          y: offsetTop + cardHeight - 100,
        });
        gsap.set(getSliderItem(i), { x: (index + 1) * numberSize });
      });

      gsap.set(".indicator", { x: -window.innerWidth });

      const startDelay = 0.6;

      gsap.to(".cover", {
        x: width + 400,
        delay: 0.5,
        ease,
        onComplete: () => {
          setTimeout(() => {
            loop();
          }, 500);
        },
      });
      rest.forEach((i, index) => {
        gsap.to(getCard(i), {
          x: offsetLeft + index * (cardWidth + gap),
          zIndex: 3,
          delay: 0.05 * index,
          ease,
          delay: startDelay,
        });
        gsap.to(getCardContent(i), {
          x: offsetLeft + index * (cardWidth + gap),
          zIndex: 4,
          delay: 0.05 * index,
          ease,
          delay: startDelay,
        });
      });
      gsap.to("#pagination", { y: 0, opacity: 1, ease, delay: startDelay });
      gsap.to("nav", { y: 0, opacity: 1, ease, delay: startDelay });
      gsap.to(detailsActive, { opacity: 1, x: 0, ease, delay: startDelay });
    }

    let clicks = 0;

    function step() {
      return new Promise((resolve) => {
        order.push(order.shift());
        detailsEven = !detailsEven;

        const detailsActive = detailsEven ? "#details-even" : "#details-odd";
        const detailsInactive = detailsEven ? "#details-odd" : "#details-even";

        document.querySelector(`${detailsActive} .place-box .text`).textContent =
          data[order[0]].place;
        document.querySelector(`${detailsActive} .title-1`).textContent =
          data[order[0]].title;
        document.querySelector(`${detailsActive} .title-2`).textContent =
          data[order[0]].title2;
        document.querySelector(`${detailsActive} .desc`).textContent =
          data[order[0]].description;

        gsap.set(detailsActive, { zIndex: 2.2 });
        gsap.to(detailsActive, { opacity: 1, delay: 0.4, ease });
        gsap.to(`${detailsActive} .text`, {
          y: 0,
          delay: 0.1,
          duration: 0.7,
          ease,
        });
        gsap.to(`${detailsActive} .title-1`, {
          y: 0,
          delay: 0.15,
          duration: 0.7,
          ease,
        });
        gsap.to(`${detailsActive} .title-2`, {
          y: 0,
          delay: 0.15,
          duration: 0.7,
          ease,
        });
        gsap.to(`${detailsActive} .desc`, {
          y: 0,
          delay: 0.3,
          duration: 0.4,
          ease,
        });
        gsap.to(`${detailsActive} .cta`, {
          y: 0,
          delay: 0.35,
          duration: 0.4,
          onComplete: resolve,
          ease,
        });
        gsap.set(detailsInactive, { zIndex: 1.2 });

        const [active, ...rest] = order;
        const prv = rest[rest.length - 1];

        gsap.set(getCard(prv), { zIndex: 1 });
        gsap.set(getCard(active), { zIndex: 2 });
        gsap.to(getCard(prv), { scale: 1.5, ease });

        gsap.to(getCardContent(active), {
          y: offsetTop + cardHeight - 10,
          opacity: 0,
          duration: 0.3,
          ease,
        });
        gsap.to(getSliderItem(active), { x: 0, ease });
        gsap.to(getSliderItem(prv), { x: -numberSize, ease });
        gsap.to(".progress-sub-foreground", {
          width: 280 * (1 / order.length) * (active + 1),
          ease,
        });

        gsap.to(getCard(active), {
          x: 0,
          y: 0,
          ease,
          width: window.innerWidth,
          height: window.innerHeight,
          borderRadius: 0,
          onComplete: () => {
            const xNew = offsetLeft + (rest.length - 1) * (cardWidth + gap);
            gsap.set(getCard(prv), {
              x: xNew,
              y: offsetTop,
              width: cardWidth,
              height: cardHeight,
              zIndex: 3,
              borderRadius: 0,
              scale: 1,
            });

            gsap.set(getCardContent(prv), {
              x: xNew,
              y: offsetTop + cardHeight - 100,
              opacity: 1,
              zIndex: 4,
            });
            gsap.set(getSliderItem(prv), { x: rest.length * numberSize });

            gsap.set(detailsInactive, { opacity: 0 });
            gsap.set(`${detailsInactive} .text`, { y: 100 });
            gsap.set(`${detailsInactive} .title-1`, { y: 100 });
            gsap.set(`${detailsInactive} .title-2`, { y: 100 });
            gsap.set(`${detailsInactive} .desc`, { y: 50 });
            gsap.set(`${detailsInactive} .cta`, { y: 60 });
            clicks -= 1;
            if (clicks > 0) {
              step();
            }
          },
        });

        rest.forEach((i, index) => {
          if (i !== prv) {
            const xNew = offsetLeft + index * (cardWidth + gap);
            gsap.set(getCard(i), { zIndex: 30 });
            gsap.to(getCard(i), {
              x: xNew,
              y: offsetTop,
              width: cardWidth,
              height: cardHeight,
              ease,
              delay: 0.1 * (index + 1),
            });

            gsap.to(getCardContent(i), {
              x: xNew,
              y: offsetTop + cardHeight - 100,
              opacity: 1,
              zIndex: 4,
              ease,
              delay: 0.1 * (index + 1),
            });
            gsap.to(getSliderItem(i), { x: (index + 1) * numberSize, ease });
          }
        });
      });
    }

    async function loop() {
      await animate(".indicator", 2, { x: 0 });
      await animate(".indicator", 0.8, { x: window.innerWidth, delay: 0.3 });
      set(".indicator", { x: -window.innerWidth });
      await step();
      loop();
    }

    async function loadImage(src) {
      return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }

    async function loadImages() {
      const promises = data.map(({ image }) => loadImage(image));
      return Promise.all(promises);
    }

    async function start() {
      try {
        await loadImages();
        init();
      } catch (error) {
        console.error("One or more images failed to load", error);
      }
    }

    start()
  }, [])

  return (
    <div className="Notices">
      <div className="indicator"></div>


      <div id='container-demo'>
        <div id="demo"></div>

        <div className="details" id="details-even">
          <div className="place-box">
            <div className="text">Switzerland Alps</div>
          </div>
          <div className="title-box-1"><div className="title-1">SAINT</div></div>
          <div className="title-box-2"><div className="title-2">ANTONIEN</div></div>
          <div className="desc">
            Tucked away in the Switzerland Alps, Saint Antönien offers an idyllic retreat for those seeking tranquility and adventure alike. It&apos;s a hidden gem for backcountry skiing in winter and boasts lush trails for hiking and mountain biking during the warmer months.
          </div>
          <div className="cta">
            <button className="bookmark">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <button className="discover">Discover Location</button>
          </div>
        </div>

        <div className="details" id="details-odd">
          <div className="place-box">
            <div className="text">Switzerland Alps</div>
          </div>
          <div className="title-box-1"><div className="title-1">SAINT </div></div>
          <div className="title-box-2"><div className="title-2">ANTONIEN</div></div>
          <div className="desc">
            Tucked away in the Switzerland Alps, Saint Antönien offers an idyllic retreat for those seeking tranquility and adventure alike. It&apos;s a hidden gem for backcountry skiing in winter and boasts lush trails for hiking and mountain biking during the warmer months.
          </div>
          <div className="cta">
            <button className="bookmark">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <button className="discover">Discover Location</button>
          </div>
        </div>

        <div className="pagination" id="pagination">
          <div className="arrow arrow-left">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </div>
          <div className="arrow arrow-right">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <div className="progress-sub-container" >
            <div className="progress-sub-background" >
              <div className="progress-sub-foreground" ></div>
            </div>
          </div>
          <div className="slide-numbers" id="slide-numbers"></div>
        </div>

        <div className="cover" ></div>
      </div>




    </div>)
}