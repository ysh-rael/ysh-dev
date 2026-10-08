import React, { useEffect, useState } from 'react';
import './styles.css'

interface IconProps {
    name: string;
    src: string;
}

const Icon: React.FC<IconProps> = ({ name, src }) => (
    <div style={{ display: 'flex', alignItems: 'center', margin: '0 10px' }}>
        <img src={src} alt={name} width="48" height="48" style={{ marginRight: '8px' }} />
        <span className='label'>{name}</span>
    </div>
);

interface IconSectionProps {
    title: string;
    icons: IconProps[];
}

const IconSection: React.FC<IconSectionProps> = ({ title, icons }) => (
    <section style={{ marginBottom: '20px' }}>
        <h2 className='subtitle'>{title}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {icons.map((icon, index) => (
                <Icon key={index} {...icon} />
            ))}
        </div>
    </section>
);

function formatHour(date: Date): string {
    return date.toLocaleTimeString().slice(0, 5)
}

export default function ProfileGithub() {

    const [currentDate, setCurrentDate] = useState(formatHour(new Date()))

    useEffect(() => {
        var updateCurrentHour = setInterval(() => {
            setCurrentDate(formatHour(new Date()))
        }, 1000)


        return () => clearInterval(updateCurrentHour)
    })
    return (
        <div className="container-about-me">
            <div className='ysh'>
                <img style={{ maxWidth: '240px' }} src="https://avatars.githubusercontent.com/u/79410863?v=4" alt="me" /> <br />
                <span className='subtitle'>ysh-rael · he/him</span>
                {/* <p className='text'>
                    🐧 Software developer with emphasis on web development
                </p> */}
                <p className='text'>
                    Analista de Sistemas na <a href="https://brasolucoes.com" target="_blank" rel="noopener noreferrer">Bra Solucoes</a>
                </p>
                <ul className='ul'>
                    <li className='li'>Belém PA, Brasil | {currentDate} (UTC -03:00)</li>
                    <li className='li'><a href="mailto:Ysp.rael@gmail.com">Ysp.rael@gmail.com</a></li>
                    <li className='li'><a href="https://linkedin/in/yshrael-pimentel">in/yshrael-pimentel</a></li>
                    <li className='li'><a href="/ysdesk">YsDesk</a></li>
                </ul>
            </div>
            <div className='box-most-languages'>
                {/* Imagens principais */}
                <img
                    style={{ float: 'right' }}
                    height="200"
                    src="https://github-readme-stats.vercel.app/api/top-langs/?username=Ysh-rael&layout=compact&langs_count=7&theme=codeSTACKr"
                    alt="Top Languages"
                />
                {/* Tabela de habilidades */}
                <div>
                    <h2 className='subtitle'>Sistema operacional principal:</h2>
                    <img
                        src="https://github.com/ysh-rael/Ysh-rael/assets/79410863/48f4af40-4a69-4e2a-a7ca-e962af4ccd82"
                        alt="Linux"
                        style={{ display: 'inline', marginRight: 8 }}
                    />{' '}
                    <span className='label'>Linux</span>
                </div>
                <div>
                    <h2 className='subtitle'>Runtime</h2>
                    <img
                        src="https://github.com/ysh-rael/Ysh-rael/assets/79410863/b57d0506-a7a0-4368-a5cd-a012de6e75d2"
                        alt="NodeJs"
                        style={{ display: 'inline', marginRight: 8 }}
                    />{' '}
                    <span className="label">NodeJs</span>
                </div>
                <div>
                    <h2 className='subtitle'>Linguagens de programação:</h2>
                    <img src="https://github.com/ysh-rael/Ysh-rael/assets/79410863/a3ebd705-1b27-4a7b-be28-71e8a046e01f" alt="JavaScript" /> &nbsp;
                    <img src="https://github.com/ysh-rael/Ysh-rael/assets/79410863/95a22a16-51e8-4c47-b5f0-4f19120ac372" alt="TypeScript" /> &nbsp;
                    <img src="https://github.com/user-attachments/assets/57081892-6001-4778-9f38-6fb64479a009" alt="Go" />
                    <img src="https://github.com/ysh-rael/Ysh-rael/assets/79410863/95592570-8eb0-41f8-87f6-144edbf3bd7a" alt="C Sharp" /> &nbsp;
                    <img src="https://github.com/ysh-rael/Ysh-rael/assets/79410863/beab89db-9957-4948-ac69-65721e83c263" alt="C++" /> &nbsp;
                    <img src="https://github.com/ysh-rael/Ysh-rael/assets/79410863/eff34fdf-8bf8-4738-9e13-2b5dc6d65c2a" alt="Python" /> &nbsp;
                </div>
                <IconSection
                    title="Bibliotecas"
                    icons={[
                        { name: 'React', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/128e29e7-541c-47b7-bb59-57531524d419' },
                        { name: 'React Native', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/97a09a90-9276-4828-ba3f-c2b1c6c76b87' },
                        { name: 'JQuery', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/5826c4a9-403c-4100-aba7-d21ce4513c07' },
                        { name: 'TensorFlow', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/f562b68f-6fa7-4953-8c7d-25a8b8b45cd6' },
                        { name: 'OpenCV', src: 'https://github.com/user-attachments/assets/8f678cc7-6a98-4d4c-a12e-73f2ee172585' },
                    ]}
                />
                <IconSection
                    title="Edição de Imagens/Vetor e Criação de Prototipagem (Design)"
                    icons={[
                        { name: 'Figma', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/2faf5e28-303e-46f5-9280-0049ca4839a9' },
                        { name: 'Gimp', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/aead66e7-1ab3-4db3-98b1-557b1a72cb68' },
                        { name: 'Inkscape', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/b5a43c49-8bc5-480c-84f1-de9f7bae7289' },
                    ]}
                />
                <IconSection
                    title="Banco de Dados"
                    icons={[
                        { name: 'MySQL', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/209ee6fe-0b76-431a-b341-f2eb05b82a3b' },
                        { name: 'MongoDB', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/a3d7d993-dd4c-4d6c-8bc4-c9d6cf552151' },
                        { name: 'SQLite', src: 'https://github.com/user-attachments/assets/14884455-0ee2-458c-b7d0-459f943d7a37' },
                    ]}
                />
                <IconSection
                    title="Marcação de Texto"
                    icons={[
                        { name: 'HTML5', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/6981479b-4cad-4c23-a72b-656fc4f5b919' },
                        { name: 'Markdown', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/4c20f38a-b4ae-46fb-81dd-fa3e970e6bc5' },
                    ]}
                />
                <IconSection
                    title="Estilo"
                    icons={[
                        { name: 'CSS3', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/26e9dc23-efbf-49d9-ba96-6213c437927d' },
                        { name: 'Bootstrap', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/f4d2d28f-492e-4d8a-9e65-2ba19555fb0f' },
                        { name: 'Bulma', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/c00ce765-87d6-4088-9fdb-f2ef28079833' },
                    ]}
                />
                <IconSection
                    title="Ferramentas de Desenvolvimento e Versionamento de Código"
                    icons={[
                        { name: 'Git', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/788d7806-a186-4827-b0dd-b7556084e493' },
                        { name: 'Gulp', src: 'https://github.com/user-attachments/assets/ff94d6df-62ed-478c-b5fc-5024b3e6a5d4' },
                        { name: 'Grunt', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/9fdc9e7a-5949-43ce-a7b3-cbd6d7f14faf' },
                        { name: 'Webpack', src: 'https://github.com/ysh-rael/Ysh-rael/assets/79410863/55565ec7-be65-447b-bb1d-a348c1fa7da0' },
                    ]}
                />
                <img src="/snake.svg" alt="snake.svg" className='animation-snake-commits'/>

            </div>
        </div>
    );
};
