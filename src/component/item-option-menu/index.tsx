import { usePathname } from 'next/navigation'
import react from 'react'

import './styles.css'

export default function ItemOptionMenu({path, children}: {children: React.ReactNode ,path: string}) {
	const pathname = usePathname()

	return (
		<a href={path} className='ItemOptionMenu'>
			<li className={`${pathname === path ? 'actived' : ''}`}>
				{children}
			</li>
		</a>
	)
}