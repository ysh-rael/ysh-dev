"use client";

import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import Logo from '../../component/Logo';
import language from "./language.js";

interface Params {}

export default function Header(params: Params) {
  const inptSearchRef = useRef<HTMLInputElement | null>(null); // Ref para o input de busca

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
    <header id="Header">
      <Logo showSecundary={true} width="normal" />

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

      <img id="img-tux" src="/tux-dev.gif" alt="Tux is also a software developer" />

      <button className="button bttn-show-options-header" type="button">
        <i className="fa fa-plus has-text-primary"></i>
      </button>

       <div className="box-options-header">
        <button className="button is-warning is-light" title="Download Curriculum">
          <i className="fa fa-download has-text-warning"></i>
        </button>

        <button className="button is-light" title="Github">
          <i className="fa fa-github"></i>
        </button>

        <button className="button is-info" title="Linkedin">
          <i className="fa fa-linkedin has-text-white"></i>
        </button>

        <button className="button is-danger is-light" title="View more options">
          <i className="fa-regular fa-envelope has-text-danger"></i>
        </button>
      </div>

    </header>
  );
}
