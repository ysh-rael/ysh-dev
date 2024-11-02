// @ts-nocheck
import { useEffect } from 'react';
import config from './config.js'
import './styles.css'
import { gsap } from "gsap";
import { dataCards } from '@/mocks/notices/data'
import ChevronScrool from '../chevron-scrool';
import Card01 from '@/component/card01';
import CardContent from '@/component/card-content';
import HighlightShowcaseController from './HighlightShowcaseController';




export default function HighlightShowcase() {

    useEffect(() => {
        const controller = new HighlightShowcaseController(dataCards);
        controller.start();
    }, []);

    return (<div className="Notices">
        <div className="indicator"></div>


        <div id='container-demo'>
            <div id="demo">
                {dataCards.map((i, index) => <Card01 key={index} image={{ url: i.image }} index={index} />)}
                {dataCards.map((i, index) => <CardContent key={i} image={i} index={index} />)}
            </div>

            <div className="details" id="details-even">
                <div className="place-box">
                    <div className="text">Switzerland Alps</div>
                </div>
                <div className="title-box-1"><div className="title-1">{dataCards[0].title}</div></div>
                <div className="title-box-2"><div className="title-2">{dataCards[0].title2}</div></div>
                <div className="desc">
                    {dataCards[0].description}
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
                <div className="title-box-1"><div className="title-1">{dataCards[0].title} </div></div>
                <div className="title-box-2"><div className="title-2">{dataCards[0].title2}</div></div>
                <div className="desc">
                    {dataCards[0].description}
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

        <ChevronScrool />

    </div>)
}