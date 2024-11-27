function gerarLinkImageLanguages(repo) {
  const github = 'https://github-readme-stats.vercel.app/api/pin'
  const username = 'ysh-rael'
  const layout = 'compact'
  const langsCount = 7
  const theme = 'codeSTACKr'

  return `${github}/?username=${username}&repo=${repo}&layout=${layout}&langs_count=${langsCount}&theme=${theme}`


}

const dataCards = [
  {
    id: 'lpr-br',
    place: 'LPR',
    title: 'LPR-br',
    title2: 'Placa Brasil/Mercosul',
    description: 'Solução para reconhecimento automático de placas veiculares, voltadas para veiculos homologados no Brasil. Ideal para sistemas de monitoramento e controle de acesso.',
    image: '/LPR-br.webp',
    owner: 'Ysh-rael',
    tags: ['Javascript', 'Node.JS', 'LPR'],
    languages: gerarLinkImageLanguages('LPR-br'),
    github: 'https://github.com/ysh-rael/LPR-br',
  },
  {
    id: 'browser-hash',
    place: 'Fingerprint Browser',
    title: 'Browser Hash',
    title2: 'ID de máquina',
    description: 'Ferramenta para identificação única de dispositivos com base em suas características específicas, utilizando fingerprinting na web.',
    image: '/tumb-browser-hash.webp',
    owner: 'Ysh-rael',
    tags: ['Javascript', 'Node.JS', 'Fingerprint', 'web', 'ID'],
    languages: gerarLinkImageLanguages('browser-hash'),
    github: 'https://github.com/ysh-rael/browser-hash',
    link: 'https://ysh-rael.github.io/browser-hash/'
  },
  {
    id: 'mcml',
    place: 'Machine Learning',
    title: 'MCML',
    title2: 'Modelos para IA',
    description: 'Criação de modelos personalizados para treinamento de redes neurais utilizando a biblioteca TensorFlow.',
    image: '/tumb-mcml-alter.webp',
    owner: 'Ysh-rael',
    tags: ['Javascript', 'Node.Js', 'Multi_Threads', 'TensorFlow'],
    languages: gerarLinkImageLanguages('MCML'),
    github: 'https://github.com/ysh-rael/MCML',
  },
  {
    id: 'worker-threads',
    place: 'Multi Threads Node.js',
    title: 'Worker Threads',
    title2: 'Node.js',
    description: 'Demonstração de otimização em Node.js usando múltiplas threads para melhorar desempenho e alocar recursos de forma eficiente.',
    image: '/tumb-work-threads-node.webp',
    owner: 'Ysh-rael',
    tags: ['Javascript', 'Node.JS'],
    languages: gerarLinkImageLanguages('worker-thread-node.js'),
    github: 'https://github.com/ysh-rael/workerThread-Node.Js'
  }
];

const outherCards = [
  {
    id: 'drag-drop',
    place: 'Templete em React',
    title: 'Drag and Drop',
    title2: 'Cards em React',
    description: 'Templete responsivo em react para sistemas \'single page\' com \'Drag and Drop\'.',
    image: '/tumb-drag-drop.webp',
    owner: 'Ysh-rael',
    tags: ['Javascript', 'React', 'templete'],
    languages: gerarLinkImageLanguages('worker-thread-node.js'),
    github: 'https://github.com/ysh-rael/drag-drop_card',
    link: 'https://ysh-rael.github.io/drag-drop_card/'
  },
]

export {
  dataCards,
  outherCards
};
