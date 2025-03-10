import { typeIconArrow } from "@/component/icon-arrow/interfaces"

function IconArrow(param0: typeIconArrow) {
    if (typeof param0.direction !== 'string') return ''

    switch (param0.direction.toLowerCase()) {
        case 'letf':
            return (<svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                />
            </svg>)
        case 'right':
            return (<svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
            </svg>)
    }
    return ''
}

export default IconArrow