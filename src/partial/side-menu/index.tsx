
import React from "react";
import "./styles.css";


export default function AsideMenu() {
	return (
		<div id="AsideMenu">
			<label htmlFor="minime-side-menu"> 
				<i className="button fa fa-arrow-left"></i> 
				<input type="checkbox" id="minime-side-menu" className="is-hidden" /> 
			</label>

		</div>
	)
}