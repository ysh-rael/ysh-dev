import React from "react";
import "./styles.css";
import Logo from '../../component/Logo'

interface Params {
  
}

export default function Header(params: Params) {
	return (
    <header
      id='Header'
   	>
     <Logo showSecundary={true}/>

      <h2>descriptio and</h2>  
      <p>lorem</p>

      <br/>
      <br/>
      <br/>
      <br/>
      <br/>

      <a href="/dashboard" className="ysh">Go to Dashboard</a>
    </header>
  );
}
