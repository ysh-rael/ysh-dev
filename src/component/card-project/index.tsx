import "./styles.css"  


export default function CardProjects() {
  return (
    <div className="CardProject card">
      <div className="card-image">
        <figure className="image is-4by3">
          <img src="https://versions.bulma.io/0.7.0/images/placeholders/1280x960.png" alt="Placeholder image"/>
        </figure>
      </div>
      <div className="card-content">
        <div className="media">
          <div className="media-content">
            <p className="title is-4">John Smith</p>
            <p className="subtitle is-6">@johnsmith</p>
          </div>
        </div>

        <div className="content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Phasellus nec iaculis mauris. <a>@bulmaio</a>.
          <a href="#">#css</a> <a href="#">#responsive</a>
          <br/>
          <time dateTime="2016-1-1">11:09 PM - 1 Jan 2016</time>
          <br/>
        </div>

        <div>
          <i className="fa fa-camera"></i>
          <i className="fa fa-camera"></i>
        </div>
      </div>
    </div>)

}