import { useState } from 'react'
import './styles.css'


interface typeIcons {
    left: string,
    right: string,
    isValid: -1|0|1,
}

function returnClassNameStyles(objectIcons: typeIcons, hidden = false) {
    if (typeof objectIcons !== 'object') return''
    return objectIcons.isValid == -1 ? hidden ? 'is-hidden' : '' : objectIcons.isValid ? 'is-danger' : 'is-success'
}

export default function Contact() {
    const initialIconsName: typeIcons = { left: 'fa-user', right: '', isValid: -1 }
    const initialIconsEmail: typeIcons = { left: 'fa-envelope', right: '', isValid: -1 }

    const [iconsName, setIconsName] = useState(initialIconsName)
    const [iconsEmail, setIconsEmail] = useState(initialIconsEmail)

    return (
        <div className='Contact'>
            <div className="public">

            </div>
            <div className="form">

                <div className="field">
                    <label className="label">Name</label>
                    <div className="control has-icons-left has-icons-right">
                        <input className={`input ${returnClassNameStyles(iconsName)}`} type="text" placeholder="Your name"/>
                        <span className="icon is-small is-left">
                            <i className={`fas ${iconsName.left}`}></i>
                        </span>
                        <span className="icon is-small is-right">
                            <i className={`fas ${iconsName.right}`}></i>
                        </span>
                    </div>
                    <p className={`help ${returnClassNameStyles(iconsName, true)}`}>Thias username is available</p>
                </div>

                <div className="field">
                    <label className="label">E-mail</label>
                    <div className="control has-icons-left has-icons-right">
                        <input className={`input ${returnClassNameStyles(iconsName)}`} type="email" placeholder="Your e-mail" />
                        <span className="icon is-small is-left">
                            <i className={`fas ${iconsEmail.left}`}></i>
                        </span>
                        <span className="icon is-small is-right">
                            <i className={`fas ${iconsEmail.right}`}></i>
                        </span>
                    </div>
                    <p className={`help ${returnClassNameStyles(iconsName, true)}`}>This email is invalid</p>
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