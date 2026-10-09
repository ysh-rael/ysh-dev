"use client";

import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import "./styles.css";
import Logo from '../../component/Logo';
import language from "./language.js";
import { searchProjects } from "@/lib/project-search";

export default function Header() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [positionTux, setPositionTux] = useState(96);
  const [tuxIsDragging, setTuxIsDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [searchIsOpen, setSearchIsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestions = query.trim() ? searchProjects(query).slice(0, 5) : [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    function closeSearch(event: PointerEvent) {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target)) {
        setSearchIsOpen(false);
        setActiveSuggestion(-1);
      }
    }

    document.addEventListener("pointerdown", closeSearch);
    return () => document.removeEventListener("pointerdown", closeSearch);
  }, []);

  function openProjectSearch(projectTitle: string) {
    setSearchIsOpen(false);
    setActiveSuggestion(-1);
    router.push(`/search/?by=${encodeURIComponent(projectTitle)}`);
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSearchIsOpen(false);
      setActiveSuggestion(-1);
      inputRef.current?.blur();
      return;
    }

    if (!suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      openProjectSearch(suggestions[activeSuggestion].title);
    }
  }

  return (
    <header 
      id="Header" 
      /* marca header como elemento que pode dar drop e ser arrastado */
      draggable={true}

      onDragOver={(event: DragEvent<HTMLElement>) => {
        if (!tuxIsDragging || event.clientX <= 0 || event.clientX >= window.innerWidth) return;

        const positionPercentage = (event.clientX / (window.innerWidth + 28)) * 100;
        
        setPositionTux(positionPercentage <= 0 ? 1 : positionPercentage > 100 ? 100 : positionPercentage);
      }}
    >

      <Link href="/"><Logo showSecundary={true} width="normal" /></Link>

      <div className="header-search" ref={searchRef}>
        <form id="header-project-search-form" action="/search/" className="header-search-form" role="search">
          <Search className="header-search-icon" size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            id="header-project-search"
            className="input"
            type="search"
            placeholder={language.english.bttnSearch}
            name="by"
            value={query}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={searchIsOpen && Boolean(query.trim())}
            aria-controls="header-search-suggestions"
            aria-activedescendant={activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveSuggestion(-1);
              setSearchIsOpen(true);
            }}
            onFocus={() => setSearchIsOpen(true)}
            onKeyDown={handleSearchKeyDown}
          />
          <span className="box-icons-keys-search" aria-hidden="true"><kbd>Ctrl</kbd><span>+</span><kbd>K</kbd></span>
        </form>

        {searchIsOpen && query.trim() && <div className="header-search-suggestions" id="header-search-suggestions" role="listbox" aria-label="Sugestões de projetos">
          {suggestions.length ? suggestions.map((project, index) => (
            <button
              className={`header-search-suggestion ${activeSuggestion === index ? "is-active" : ""}`}
              id={`search-suggestion-${index}`}
              key={project.id}
              type="button"
              role="option"
              aria-selected={activeSuggestion === index}
              onMouseEnter={() => setActiveSuggestion(index)}
              onClick={() => openProjectSearch(project.title)}
            >
              <span className="header-suggestion-thumb"><Image src={project.image} alt="" fill sizes="44px" /></span>
              <span className="header-suggestion-copy"><strong>{project.title}</strong><small>{project.place} · {project.tags.slice(0, 2).join(" · ")}</small></span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          )) : <p className="header-search-empty">Nenhum projeto encontrado para “{query.trim()}”.</p>}
          <button className="header-search-all" type="submit" form="header-project-search-form">Ver resultados para “{query.trim()}” <ArrowRight size={14} aria-hidden="true" /></button>
        </div>}
      </div>

      <Image id="img-tux" src="/tux-dev.gif" width={48} height={48} unoptimized alt="Tux is also a software developer" style={{ left: `${positionTux > 100 ? 100 : positionTux}%`}} onDragStart={() => setTuxIsDragging(true)} onDragEnd={() => setTuxIsDragging(false)} />

      <a className="button bttn-show-options-header" type="button">
        <i className="fa fa-plus has-text-primary"></i>
      </a>

      <div className="box-options-header box-social-media">
        <a download='yshrael-curriculo-pt-2024' href='/curriculo.pdf' className="button is-success is-light" title="Download Curriculum">
          <i className="fa fa-download has-text-success"></i>
        </a>

        <a href='https://github.com/ysh-rael/' target='_blank' className="button is-light" title="Github">
          <i className="fa fa-github"></i>
        </a>

        <a href='https://www.linkedin.com/in/yshrael-pimentel/' target='_blank' className="button is-info" title="Linkedin">
          <i className="fa fa-linkedin has-text-white"></i>
        </a>

        <a href='mailto:ysp.rael@gmail.com' target='_blank'  className="button is-danger is-light" title="Enviar Email">
          <i className="fa-regular fa-envelope has-text-danger"></i>
        </a>
      </div>

    </header>
  );
}
