import './styles.css'

interface TypeCard01Contents {
    index: number;
    image: {
        place: string;
        title: string;
        title2: string;
    };
}

export default function CardContent({ image, index }: TypeCard01Contents) {
    return (

        <div className="CardContent card-content" id={`card-content-${index}`}>
            <div className="content-start"></div>
            <div className="content-place">{image.place}</div>
            <div className="content-title-1">{image.title}</div>
            <div className="content-title-2">{image.title2}</div>

        </div>
    )
}
