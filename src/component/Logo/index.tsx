import React from 'react'
import Styles from './styles.module.css'

export default function Logo({
	showSecundary,
	width
} : {
	showSecundary?: boolean,
	width: 'small' | 'normal' | 'big'

}) {
	return <div className={`${Styles.Logo} ${Styles[width]}`}>
		<span className={`${Styles.Primary}`}> Ysh</span> 

		{ showSecundary && <span className={`${Styles.Secundary} tag has-text-primary`}> Software Developer </span> }
		
	</div>
}