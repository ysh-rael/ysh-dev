"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Code2, Pause, Play, Sparkles } from "lucide-react";
import { dataCards } from "@/mocks/notices/data";
import "./styles.css";

const autoplayDelay = 7000;
const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
    const query = window.matchMedia(motionQuery);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function getMotionPreference() {
    return window.matchMedia(motionQuery).matches;
}

function slideNumber(index: number) {
    return String(index + 1).padStart(2, "0");
}

export default function HighlightShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const prefersReducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, () => true);
    const [autoplayPreference, setAutoplayPreference] = useState<boolean | null>(null);
    const isPaused = autoplayPreference ?? prefersReducedMotion;
    const touchStartX = useRef<number | null>(null);
    const activeProject = dataCards[activeIndex];

    useEffect(() => {
        if (isPaused || prefersReducedMotion || dataCards.length < 2) return;

        const timer = window.setInterval(() => {
            setActiveIndex((index) => (index + 1) % dataCards.length);
        }, autoplayDelay);

        return () => window.clearInterval(timer);
    }, [activeIndex, isPaused, prefersReducedMotion]);

    function goTo(index: number) {
        setActiveIndex((index + dataCards.length) % dataCards.length);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(activeIndex - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(activeIndex + 1);
        }
    }

    function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
        if (touchStartX.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(distance) < 48) return;
        goTo(activeIndex + (distance < 0 ? 1 : -1));
    }

    if (!activeProject || dataCards.length === 0) return null;

    return (
        <section
            className="Notices highlight-showcase"
            aria-label="Projetos em destaque"
            aria-roledescription="carrossel"
            onKeyDown={handleKeyDown}
            onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
            onTouchEnd={handleTouchEnd}
        >
            <div className="showcase-backdrop" key={activeProject.id}>
                <Image className="showcase-background" src={activeProject.image} alt="" fill priority sizes="100vw" />
            </div>
            <div className="showcase-scrim" />
            <div className="showcase-grain" aria-hidden="true" />

            <div className="showcase-layout">
                <div className="showcase-copy" key={activeProject.id} aria-live="polite">
                    <div className="showcase-kicker"><Sparkles size={14} aria-hidden="true" /> PROJETO EM DESTAQUE <span /></div>
                    <div className="showcase-project-index">{slideNumber(activeIndex)} <i /> {slideNumber(dataCards.length-1)}</div>
                    <p className="showcase-place">{activeProject.place}</p>
                    <h1 className="showcase-title"><span>{activeProject.title}</span><em>{activeProject.title2}</em></h1>
                    <p className="showcase-description">{activeProject.description}</p>

                    <div className="showcase-tags" aria-label="Tecnologias">
                        {activeProject.tags.slice(0, 4).map((tag: string) => <span key={tag}>{tag}</span>)}
                    </div>

                    <div className="showcase-actions">
                        {activeProject.link && <a className="showcase-primary-link" href={activeProject.link} target="_blank" rel="noreferrer">
                            Explorar projeto <ArrowUpRight size={17} aria-hidden="true" />
                        </a>}
                        <a className="showcase-github-link" href={activeProject.github} target="_blank" rel="noreferrer" aria-label={`Ver ${activeProject.title} no GitHub`}>
                              <Code2 size={18} aria-hidden="true" /> <span>Ver código</span>
                        </a>
                    </div>
                </div>

                <nav className="showcase-rail" aria-label="Escolher projeto">
                    <span className="showcase-rail-label">PORTFÓLIO <i /></span>
                    {dataCards.map((project: typeof dataCards[number], index: number) => (
                        <button
                            className={`showcase-thumb ${index === activeIndex ? "is-active" : ""}`}
                            key={project.id}
                            type="button"
                            aria-label={`${slideNumber(index)} · ${project.title}, ${project.title2}`}
                            aria-current={index === activeIndex ? "true" : undefined}
                            onClick={() => goTo(index)}
                        >
                            <span className="showcase-thumb-image"><Image src={project.image} alt="" fill sizes="120px" /></span>
                            <span className="showcase-thumb-copy"><small>{slideNumber(index)}</small><strong>{project.title}</strong></span>
                            <ArrowUpRight className="showcase-thumb-arrow" size={15} aria-hidden="true" />
                        </button>
                    ))}
                </nav>
            </div>

            <div className="showcase-controls" aria-label="Controles do carrossel">
                <button className="showcase-icon-button" type="button" aria-label="Projeto anterior" title="Projeto anterior" onClick={() => goTo(activeIndex - 1)}>
                    <ArrowLeft size={17} aria-hidden="true" />
                </button>
                <button className="showcase-icon-button" type="button" aria-label="Próximo projeto" title="Próximo projeto" onClick={() => goTo(activeIndex + 1)}>
                    <ArrowRight size={17} aria-hidden="true" />
                </button>
                <span className="showcase-control-count"><strong>{slideNumber(activeIndex)}</strong> / {slideNumber(dataCards.length-1)}</span>
                <div className="showcase-progress" aria-hidden="true">
                    <span key={`${activeIndex}-${isPaused}`} className={isPaused ? "is-paused" : ""} style={{ animationDuration: `${autoplayDelay}ms` }} />
                </div>
                <button
                    className="showcase-icon-button showcase-play-button"
                    type="button"
                    aria-label={isPaused ? "Reproduzir carrossel" : "Pausar carrossel"}
                    aria-pressed={isPaused}
                    title={isPaused ? "Reproduzir carrossel" : "Pausar carrossel"}
                      onClick={() => setAutoplayPreference(!isPaused)}
                >
                    {isPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
                </button>
                <a className="showcase-all-projects" href="#all-projects">Ver todos <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
        </section>
    );
}
