// @ts-nocheck
import { useEffect } from 'react';
import config from './hooks/use-highlight-show-case/config.js'
import './styles.css'
import { gsap } from "gsap";
import { dataCards } from '@/mocks/notices/data'
import ChevronScrool from '../chevron-scrool';
import Card01 from '@/component/card01';
import CardContent from '@/component/card-content';
import UseHighlightShowcase from './hooks/use-highlight-show-case/index';
import IconArrow from '../icon-arrow';
import IconBookmark from '../icon-bookmark';


export default function HighlightShowcase() {
    const controller = new UseHighlightShowcase(dataCards);

    useEffect(() => {
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
                    <div className="text">{dataCards[0].place}</div>
                </div>
                <div className="title-box-1"><div className="title-1">{dataCards[0].title}</div></div>
                <div className="title-box-2"><div className="title-2">{dataCards[0].title2}</div></div>
                <div className="desc">
                    {dataCards[0].description}
                </div>
                <div className="cta">
                    
                    <a href="#all-projects" className="discover">Visualizar em Projetos</a>
                </div>
            </div>

            <div className="details" id="details-odd">
                <div className="place-box">
                    <div className="text">{dataCards[0].place}</div>
                </div>
                <div className="title-box-1"><div className="title-1">{dataCards[0].title} </div></div>
                <div className="title-box-2"><div className="title-2">{dataCards[0].title2}</div></div>
                <div className="desc">
                    {dataCards[0].description}
                </div>
                <div className="cta">
                    <a href="#all-projects" className="discover">Visualizar em Projetos</a>
                </div>
            </div>

            <div className="pagination" id="pagination">
                <div className="arrow arrow-left" onClick={() => controller.step(-1)}>
                    <IconArrow direction='letf' />
                </div>
                <div className="arrow arrow-right" onClick={() => controller.step(1)}>
                    <IconArrow direction='right' />
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
