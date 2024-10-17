
import './styles.css'

interface TypeCard01 {
    index: number;
    image: {
        url: string;
    };
}

export default function Card01({ image: { url }, index }: TypeCard01) {
    return (
        <div className='Card01' id={`card${index}`} style={{ backgroundImage: `url(${url})` }}>
        </div>
    )
}
