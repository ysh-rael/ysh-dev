"use client";

import React, { ImgHTMLAttributes } from "react";
import "./styles.css";
import Logo from '../../component/Logo'

interface Params {
  
}

export default function Header(params: Params) {
	return (
    <header
      id='Header'
   	>
     <Logo showSecundary={true} width="normal"/>

    <div className="field">
      <p className="control has-icons-left has-icons-right">
        <input className="input" type="search" placeholder="Search" />
        <span className="icon is-small is-left">
          <i className="fas fa-envelope"></i>
        </span>
        <span className="icon is-small is-right">
          <i className="fas fa-"></i>
        </span>
      </p>
    </div>

      <a href="/dashboard" className="ysh">Go to Dashboard</a>
      <img id="img-tux" src="/tux-dev.gif" alt="Tux is also a software developer"/>
    </header>
  );
}
