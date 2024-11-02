


// @ts-nocheck
'use client'
import './styles.css'
import CardProject from '@/component/card-project';
import ProfileGithub from '@/component/profile-github';
import Contact from '@/component/contect';
import HighlightShowcase from '@/component/highlight-show-case';

export default function Home() {

  return (
    <div className='Home'>

      <HighlightShowcase />

      <span className='title'>Projects</span>
      <div className='conteiner-cards-projects'>

        <CardProject />
        <CardProject />
        <CardProject />
        <CardProject />
        <CardProject />

      </div>

      <span className='title'>Contact me</span>
      <div className="conteiner-contact-me">
        <Contact />

        <div className="container-media-social">
          <button className="button is-warning is-light" title="Download Curriculum">
            <i className="fa fa-download has-text-warning"></i>
          </button>

          <button className="button is-light" title="Github">
            <i className="fa fa-github"></i>
          </button>

          <button className="button is-info" title="Linkedin">
            <i className="fa fa-linkedin has-text-white"></i>
          </button>

          <button className="button is-danger is-light" title="View more options">
            <i className="fa-regular fa-envelope has-text-danger"></i>
          </button>
        </div>
      </div>

      <span className='title'>About me</span>
      <div className="conteiner-about-me">
        <ProfileGithub />
      </div>

      <footer className='footer'>@Ysh-rael - 2024 <code>V3.0.0</code></footer>

    </div>
  )
}