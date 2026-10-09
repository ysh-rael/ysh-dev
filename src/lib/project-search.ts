import { dataCards, outherCards } from "@/mocks/notices/data";

export interface ProjectSearchItem {
  id: string;
  place: string;
  title: string;
  title2: string;
  description: string;
  image: string;
  owner: string;
  tags: string[];
  languages: string;
  github: string;
  link?: string;
}

export const projectCatalog = [...dataCards, ...outherCards] as ProjectSearchItem[];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function searchProjects(query: string) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return projectCatalog;

  return projectCatalog.filter((project) => {
    const searchableText = normalize([
      project.id,
      project.place,
      project.title,
      project.title2,
      project.description,
      ...project.tags,
    ].join(" "));
    return terms.every((term) => searchableText.includes(term));
  });
}