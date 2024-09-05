"use client";

import React, { ImgHTMLAttributes } from "react";
import "./styles.css";
import Logo from '../../component/Logo'
import language from "./language.js"

interface Params {
  
}

export default function Header(params: Params) {
	return (
    <header
      id='Header'
   	>
     <Logo showSecundary={true} width="normal"/>

      <form action="/search/">
        <div className="field is-flex">
          <p className="control has-icons-right">
            <input className="input" type="search" placeholder={language.english.bttnSearch} name="by" />
            <span className="icon is-small is-right">
              <i className="fas fa-search"></i>
            </span>
          </p>
              
          <button type="submit" className="ml-2 button is-primary is-light">{language.english.bttnSearch}</button>
        </div>
      </form>

      <img id="img-tux" src="/tux-dev.gif" alt="Tux is also a software developer"/>

      <div className="box-options-header">

        <button className="button is-warning is-light" title="Download Curriculum">
          <i className=" fa fa-download has-text-warning"></i>
        </button>

        <button className="button is-light" title="Github">
          <i className=" fa fa-github"></i>
        </button>

        <button className="button is-info" title="Linkedin">
          <i className=" fa fa-linkedin has-text-white"></i>
        </button>

        <button className="button is-danger is-light" title="View more options">
          <i className="fa-regular fa-envelope has-text-danger"></i>
        </button>

      </div>
    </header>
  );
}
