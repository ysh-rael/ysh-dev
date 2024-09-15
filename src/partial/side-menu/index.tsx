
'use client'
import React from "react";
import "./styles.css";
import language from "./language.js";
import { usePathname } from "next/navigation";
import ItemOptionMenu from "@/component/item-option-menu";
const PATH = {
	notices: '/notices',
	projects: '/projects',
	goals: '/goals',
}


export default function AsideMenu() {
	const pathname = usePathname()

	return (
		<div id="AsideMenu">
			<label htmlFor="minime-side-menu"> 
				<i className="button fa fa-arrow-left"></i> 
				<input type="checkbox" id="minime-side-menu" className="is-hidden" /> 
			</label>

			<div className="group-options-menu">
			<span id="title">{language.portuguese.dashboard.title}</span>
			<ul className="ul">
				<ItemOptionMenu path={PATH.notices}>
					<i className="fa-solid fa-mug-hot"></i> 
					<span>{language.portuguese.dashboard.list[0]}</span> 
				</ItemOptionMenu>

				<ItemOptionMenu path={PATH.projects}>
					<i className="fa-solid fa-rocket"></i>
					<span>{language.portuguese.dashboard.list[1]}</span> 
				</ItemOptionMenu>

				<ItemOptionMenu path={PATH.goals}>
					<i className="fa-solid fa-list"></i>
					<span>{language.portuguese.dashboard.list[2]}</span> 
				</ItemOptionMenu>
			</ul>
				
			</div>


			<div className="group-options-menu">
				<span id="title">{language.portuguese.aboutMe.title}</span>
				<ul className="ul">
					<ItemOptionMenu path={PATH.notices}>
						<i className="fa fa-linux"></i> 
						<span>{language.portuguese.aboutMe.list[0]}</span> 
					</ItemOptionMenu>
				</ul>
			</div>

		</div>
	)
}