"use client";

import React, { DragEventHandler, useEffect, useRef, useState } from "react";
import "./styles.css";
import Logo from '../../component/Logo';
import language from "./language.js";

interface Params {}

export default function Header(params: Params) {
  const inptSearchRef = useRef<HTMLInputElement | null>(null); // Ref para o input de busca
  const [positionTux, setPositionTux] = useState(98)
  const [tuxIsDragging, setTuxIsDragging] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        inptSearchRef.current?.focus(); // Dá foco no input
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };

  }, []);

  return (
    <header 
      id="Header" 
      onDragOver={(event: any) => {
        if (!tuxIsDragging || event.clientX <= 0 || event.clientX >= window.innerWidth) return;

        const positionPercentage = (event.clientX / (window.innerWidth + 56)) * 100;
        
        setPositionTux(positionPercentage <= 0 ? 1 : positionPercentage > 100 ? 100 : positionPercentage);
      }}
    >

      <a href="/"><Logo showSecundary={true} width="normal" /></a>

      <form action="/search/">
        <div className="field is-flex">
          <p className="control has-icons-left has-icons-right">
            <span className="icon is-small is-left">
              <i className="fas fa-search"></i>
            </span>
            <input
              ref={inptSearchRef} 
              className="input"
              type="search"
              placeholder={language.english.bttnSearch}
              name="by"
            />
            <span className="icon is-small is-right box-icons-keys-search">
              <span className="tag">Ctrl</span> + 
              <span className="tag">K</span>
            </span>
          </p>
        </div>
      </form>

      <img id="img-tux" src="/tux-dev.gif" alt="Tux is also a software developer" style={{left: `calc(${positionTux}% ${positionTux >= 98 ? '- 32px' : ''})` || 'calc(100% - 56px)'}} onDragStart={() => setTuxIsDragging(true)} onDragEnd={() => setTuxIsDragging(false)} />

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
