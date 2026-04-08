export interface TipologiaCicloviaria {
  id: string;
  title: string;
  description: string;
}

export const tipologiasCicloviarias: TipologiaCicloviaria[] = [
  {
    id: "ciclovia",
    title: "Ciclovia",
    description:
      "Estrutura destinada ao tráfego exclusivo de bicicletas, separada fisicamente da faixa de rolamento dos automóveis e pedestres, através de desnível ou elemento de proteção, podendo ser unidirecional ou bidirecional.",
  },
  {
    id: "ciclofaixa",
    title: "Ciclofaixa",
    description:
      "Faixa de tráfego de bicicleta, implantada no mesmo sentido da via, separada da faixa de rolamento dos automóveis por pintura asfáltica e/ou tachões refletivos.",
  },
  {
    id: "ciclofaixa-via-calma",
    title: "Ciclofaixa (via calma)",
    description:
      "Faixa preferencial para bicicletas, definida por sinalização horizontal tracejada, localizada na borda direita das vias lentas do eixo estrutural, no mesmo sentido da via.",
  },
  {
    id: "ciclofaixa-sobre-calcada",
    title: "Ciclofaixa sobre a calçada",
    description:
      "Faixa preferencial de tráfego de bicicleta, implantada no mesmo nível da calçada, balizada com sinalização horizontal localizada ao lado da faixa de passeio destinada aos pedestres.",
  },
  {
    id: "passeio-compartilhado",
    title: "Passeio compartilhado",
    description:
      "Estrutura cicloviária implantada na calçada (passeio) junto ao espaço destinado ao pedestre.",
  },
  {
    id: "ciclorrota",
    title: "Ciclorrota",
    description:
      "Percurso recomendado em vias de menor fluxo, por onde a bicicleta divide o espaço da via com o automóvel, indicado na via pública por sinalização horizontal.",
  },
  {
    id: "descaracterizada",
    title: "Descaracterizada",
    description:
      "Trecho que deixou de atender às características da tipologia original na base municipal (campo correspondente na camada IPPUC). No mapa do app, aparece agrupado visualmente com ciclorrota e requer atenção.",
  },
];
