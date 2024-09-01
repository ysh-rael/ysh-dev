import React from 'react'
import Styles from './styles.module.css'
import language from './language.js'

export default function Logo({
	showSecundary,
	width
} : {
	showSecundary?: boolean,
	width: 'small' | 'normal' | 'big'

}) {
	return <div className={`${Styles.Logo} ${Styles[width]}`}>
		<span className={`${Styles.Primary}`}> Ysh</span> 

		{ showSecundary && <span className={`${Styles.Secundary} tag has-text-primary`}> {language.english.secundary} </span> }
		
	</div>
}