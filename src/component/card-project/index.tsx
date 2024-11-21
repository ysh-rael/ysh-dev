import { useEffect, useState } from "react";
import "./styles.css"

interface data {
  place: string;
  title: string;
  title2: string;
  description: string;
  image: string;
  owner: string;
  tags: string[];
  link: string | undefined;
  github: string | undefined;
  languages: string | undefined;
  usingLanguages: boolean;
}

export default function CardProject({ data }: { data: data }) {
  
  if (typeof data.usingLanguages !== 'boolean')
    data.usingLanguages = !!data.usingLanguages
  const [dataCards, setDataCards] = useState(data)



  return (
    <div className="CardProject card">
      <div className="card-image">
        <figure className="image is-5by3 image-card">
          <picture 
          >
            {dataCards.image ? (
              <>
                <img src="/templete-img-1280x960.webp" alt="Fallback image\" />
                <img src={dataCards.usingLanguages ? dataCards.languages : dataCards.image} alt='Nao foi possivel carregar imagem' />

              </>
            ) : (
              <>
                <img src="/templete-img-1280x960.webp" alt="Fallback image\" />
              </>
            )}
          </picture>


        </figure>
      </div>
      <div className="card-content">
        <div className="media">
          <div className="media-content">
            <p className="title is-4">{dataCards.title}</p>
            <p className="subtitle is-6"> -&gt; {dataCards.place}</p>
          </div>
        </div>

        <div className="content">
          {dataCards.description}
        </div>

        <div className="is-hidden">
          {dataCards.tags.map($ => (<a>@{$}</a>))}
        </div>

        <div className="group-buttons">
          {
            /*<button
          type="button"
            className={'button is-warning'}
            title='Visualzar Detalhes'
            onClick={() => setDataCards($ => ({...$, usingLanguages: !$.usingLanguages}))}
          >
            <i className="fa fa-bolt"></i>
          </button> */
          }

          <a
            href={dataCards.github}
            target="_blank"
            className={`button is-primary has-text-white ${!dataCards.github ? 'is-disabled' : ''}`}
            title={dataCards.github ? 'Ver no Github' : 'Link indisponível'}
          >
            <i className="fa fa-github"></i>
          </a>

          <a
            href={dataCards.link}
            target="_blank"
            className={`button is-link ${!dataCards.link ? 'is-disabled' : ''}`}
            title={dataCards.link ? 'Ver deploy' : 'Link indisponível'}
          >
            <i className="fa fa-link"></i>
          </a>
        </div>

      </div>
    </div>)

}