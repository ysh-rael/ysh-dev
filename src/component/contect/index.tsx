import './styles.css'

export default function Contact() {
    return (
        <div className='Contact'>
            <div className="public">

            </div>
            <div className="form">

                <div className="field">
                    <label className="label">Seu nome</label>
                    <div className="control has-icons-left has-icons-right">
                        <input className="input is-success" type="text" placeholder="Text input" value="bulma" />
                        <span className="icon is-small is-left">
                            <i className="fas fa-user"></i>
                        </span>
                        <span className="icon is-small is-right">
                            <i className="fas fa-check"></i>
                        </span>
                    </div>
                    <p className="help is-success">This username is available</p>
                </div>

                <div className="field">
                    <label className="label">Email</label>
                    <div className="control has-icons-left has-icons-right">
                        <input className="input is-danger" type="email" placeholder="Email input" value="hello@" />
                        <span className="icon is-small is-left">
                            <i className="fas fa-envelope"></i>
                        </span>
                        <span className="icon is-small is-right">
                            <i className="fas fa-exclamation-triangle"></i>
                        </span>
                    </div>
                    <p className="help is-danger">This email is invalid</p>
                </div>

                <div className="field">
                    <label className="label">Assunto</label>
                    <div className="control">
                        <div className="select">
                            <select>
                                <option>Comercial</option>
                                <option>Encontrei um bug</option>
                                <option>Sujestao de melhoria</option>
                                <option>Outro</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label className="label">Message</label>
                    <div className="control">
                        <textarea className="textarea" placeholder="Textarea"></textarea>
                    </div>
                </div>

                <div className="field">
                    <div className="control">
                        <label className="checkbox">
                            <input type="checkbox" />&nbsp;
                            I agree to the <a href="#">terms and conditions</a>
                        </label>
                    </div>
                </div>


                <div className="field is-grouped">
                    <div className="control">
                        <button className="button is-link">Submit</button>
                    </div>
                </div>
            </div>

        </div>
    )
}