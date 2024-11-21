


// @ts-nocheck
'use client'
import './styles.css'
import CardProject from '@/component/card-project';
import ProfileGithub from '@/component/profile-github';
import Contact from '@/component/contect';
import HighlightShowcase from '@/component/highlight-show-case';
import { dataCards, outherCards } from '@/mocks/notices/data';

export default function Home() {

  return (
    <div className='Home'>

      <HighlightShowcase />


      <span className='title'>About me</span>
      <div className="conteiner-about-me">
        <ProfileGithub />
      </div>



      <span className='title'>All Public Projects</span>
      <div className='conteiner-cards-projects'>
        {[...dataCards, ...outherCards].map(($, i) => <CardProject
          key={i}
          data={$}
        />)}
      </div>


      <footer className='footer'>

        <div className="container-social-media">
          <button className="button is-success has-text-success is-light" title="Download Curriculum">
            <i className="fa fa-download"></i><span className='label-btton' >&nbsp;Curriculum</span>
          </button>

          <button className="button is-light" title="Github">
            <i className="fa fa-github"></i><span className="label-btton">&nbsp;Github</span>
          </button>

          <button className="button is-info" title="Linkedin">
            <i className="fa fa-linkedin has-text-white"></i><span className="label-btton">&nbsp;Linkedin</span>
          </button>

          <button className="button is-danger is-light" title="Send me an e-mail">
            <i className="fa-regular fa-envelope"></i><span className="label-btton">&nbsp;Enviar E-mail</span>
          </button>
        </div>

        <div>@Ysh-rael - 2024 <code>V3.0.0</code></div>
        </footer>

    </div>
  )
}