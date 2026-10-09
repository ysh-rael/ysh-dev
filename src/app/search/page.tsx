import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Header from "@/partial/header";
import { projectCatalog, searchProjects } from "@/lib/project-search";
import "./styles.css";

export const metadata: Metadata = {
  title: "Buscar projetos | Ysh-Dev",
  description: "Pesquise os projetos públicos de Yshrael.",
};

interface SearchPageProps {
  searchParams: Promise<{ by?: string | string[] }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = Array.isArray(params.by) ? params.by[0] || "" : params.by || "";
  const projects = query ? searchProjects(query) : projectCatalog;

  return (
    <div className="search-route">
      <Header />
      <main className="search-results-page">
        <div className="search-results-inner">
          <div className="search-results-heading">
            <span className="search-results-eyebrow">PORTFÓLIO PÚBLICO</span>
            <h1>{query ? <>Resultados para <em>“{query}”</em></> : <>Todos os <em>projetos</em></>}</h1>
            <p>{projects.length} {projects.length === 1 ? "projeto encontrado" : "projetos encontrados"}</p>
          </div>

          {projects.length ? <div className="search-results-grid">
            {projects.map((project) => {
              const projectUrl = project.link || project.github;
              return (
                <article className="search-result-card" key={project.id}>
                  <a className="search-result-image" href={projectUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${project.title}`}>
                    <Image src={project.image} alt={`Imagem do projeto ${project.title}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
                    <span className="search-result-number">{String(projects.indexOf(project) + 1).padStart(2, "0")}</span>
                  </a>
                  <div className="search-result-content">
                    <span className="search-result-place">{project.place}</span>
                    <h2>{project.title}<small>{project.title2}</small></h2>
                    <p>{project.description}</p>
                    <div className="search-result-tags">{project.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <a className="search-result-link" href={projectUrl} target="_blank" rel="noreferrer">
                      {project.link ? "Abrir projeto" : "Ver no GitHub"} <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div> : <div className="search-no-results"><span aria-hidden="true">⌕</span><h2>Nenhum projeto encontrado</h2><p>Tente buscar por nome, tecnologia ou categoria.</p><a href="/search/">Ver todos os projetos</a></div>}
        </div>
      </main>
    </div>
  );
}