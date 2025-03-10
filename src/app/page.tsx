


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

      {/* <HighlightShowcase /> */}

      <br /><br />
      <span className='title'>About me</span>
      <div className="conteiner-about-me">
        <ProfileGithub />
      </div>



      <span className='title' id='all-projects'>All Public Projects</span>
      <div className='conteiner-cards-projects'>
        {[...dataCards, ...outherCards].map(($, i) => <CardProject
          key={i}
          data={$}
        />)}
      </div>


      <footer className='footer'>

        <div className="container-social-media">
          <a download='yshrael-curriculo-pt-2024' href='/curriculo.pdf' className="button is-success has-text-success is-light" title="Download Curriculum">
            <i className="fa fa-download"></i><span className='label-btton' >&nbsp;Curriculum</span>
          </a>

          <a href='https://github.com/ysh-rael/' target='_blank' className="button is-light" title="Github">
            <i className="fa fa-github"></i><span className="label-btton">&nbsp;Github</span>
          </a>

          <a href='https://www.linkedin.com/in/yshrael-pimentel/' target='_blank' className="button is-info" title="Linkedin">
            <i className="fa fa-linkedin has-text-white"></i><span className="label-btton">&nbsp;Linkedin</span>
          </a>

          <a href='mailto:ysp.rael@gmail.com' target='_blank' className="button is-danger is-light" title="Send me an e-mail">
            <i className="fa-regular fa-envelope"></i><span className="label-btton">&nbsp;Enviar E-mail</span>
          </a>
        </div>

        <div>@Ysh-rael - 2024 <code>V3.0.0</code></div>
        </footer>

    </div>
  )
}