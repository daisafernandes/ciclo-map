import { LatLngExpression } from "leaflet";

/**
 * Trechos de referência quando `VITE_CICLOVIAS_LIVE_URL` não está configurada.
 * Nomenclatura alinhada à camada IPPUC (GeoCuritiba); geometrias são simplificadas para o mapa.
 */

export type CicloviaDataSource = "static" | "live";

export interface Ciclovia {
  id: string;
  name: string;
  street: string;
  coordinates: LatLngExpression[];
  length: number; // km
  type: "ciclovia" | "ciclofaixa" | "ciclorrota";
  safety: "safe" | "moderate" | "caution";
  avgTraffic: "low" | "medium" | "high";
  description: string;
  neighborhood: string;
  /** Origem dos dados exibidos no mapa. */
  dataSource?: CicloviaDataSource;
  /** Rótulo do tipo na base IPPUC (camada ao vivo). */
  tipoLabelIppuc?: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  rain: number;
  condition: string;
  icon: string;
  updatedAt: string;
}

export interface TrafficHistory {
  hour: string;
  movement: number;
  cyclists: number;
}

export const ciclovias: Ciclovia[] = [
  {
    id: "1",
    name: "Ciclovia Linha Verde",
    street: "BR-476 / Linha Verde",
    coordinates: [
      [-25.4195, -49.2646],
      [-25.4250, -49.2660],
      [-25.4320, -49.2680],
      [-25.4400, -49.2710],
      [-25.4480, -49.2735],
      [-25.4560, -49.2760],
    ],
    length: 18.2,
    type: "ciclovia",
    safety: "safe",
    avgTraffic: "high",
    description:
      "Eixo estrutural da Linha Verde com separação física do tráfego motorizado. Trecho esquemático; rede oficial no painel GeoCuritiba (IPPUC).",
    neighborhood: "Prado Velho / Hauer",
  },
  {
    id: "2",
    name: "Ciclovia Av. Marechal Floriano Peixoto",
    street: "Av. Marechal Floriano Peixoto",
    coordinates: [
      [-25.4380, -49.2580],
      [-25.4410, -49.2565],
      [-25.4450, -49.2545],
      [-25.4500, -49.2520],
      [-25.4540, -49.2500],
    ],
    length: 4.8,
    type: "ciclofaixa",
    safety: "moderate",
    avgTraffic: "high",
    description:
      "Ciclofaixa na Marechal Floriano Peixoto (eixo sul). Ilustração aproximada; confira geometria e situação em GeoCuritiba.",
    neighborhood: "Boqueirão",
  },
  {
    id: "3",
    name: "Ciclovia Parque Barigui",
    street: "Parque Barigui",
    coordinates: [
      [-25.4100, -49.3110],
      [-25.4130, -49.3095],
      [-25.4155, -49.3080],
      [-25.4180, -49.3060],
      [-25.4210, -49.3045],
      [-25.4240, -49.3030],
    ],
    length: 5.2,
    type: "ciclovia",
    safety: "safe",
    avgTraffic: "medium",
    description:
      "Percurso no Parque Barigui, uso recreativo. Corresponde à lógica de parques da rede municipal (mapas IPPUC / referência cicloviária).",
    neighborhood: "Santo Inácio",
  },
  {
    id: "4",
    name: "Ciclofaixa Av. Sete de Setembro",
    street: "Av. Sete de Setembro",
    coordinates: [
      [-25.4284, -49.2713],
      [-25.4290, -49.2740],
      [-25.4295, -49.2770],
      [-25.4300, -49.2800],
      [-25.4305, -49.2830],
    ],
    length: 3.1,
    type: "ciclofaixa",
    safety: "moderate",
    avgTraffic: "high",
    description:
      "Faixa no eixo central da Av. Sete de Setembro — área de alto fluxo. Traçado simplificado para visualização.",
    neighborhood: "Centro",
  },
  {
    id: "5",
    name: "Ciclovia Av. Cândido de Abreu",
    street: "Av. Cândido de Abreu",
    coordinates: [
      [-25.4160, -49.2670],
      [-25.4175, -49.2700],
      [-25.4190, -49.2730],
      [-25.4200, -49.2760],
    ],
    length: 2.4,
    type: "ciclovia",
    safety: "safe",
    avgTraffic: "medium",
    description:
      "Ligação Centro Cívico / entorno do Bosque do Papa. Tipologia ciclovia conforme classificação IPPUC.",
    neighborhood: "Centro Cívico",
  },
  {
    id: "6",
    name: "Ciclorrota Av. República Argentina",
    street: "Av. República Argentina",
    coordinates: [
      [-25.4450, -49.2860],
      [-25.4420, -49.2840],
      [-25.4390, -49.2820],
      [-25.4360, -49.2800],
      [-25.4330, -49.2780],
    ],
    length: 3.8,
    type: "ciclorrota",
    safety: "caution",
    avgTraffic: "high",
    description:
      "Ciclorrota em eixo com tráfego compartilhado (Av. República Argentina). Exige atenção; dados oficiais na base municipal.",
    neighborhood: "Água Verde",
  },
  {
    id: "7",
    name: "Ciclovia Parque Tingui",
    street: "Parque Tingui",
    coordinates: [
      [-25.3820, -49.3050],
      [-25.3850, -49.3040],
      [-25.3880, -49.3025],
      [-25.3910, -49.3010],
    ],
    length: 3.0,
    type: "ciclovia",
    safety: "safe",
    avgTraffic: "low",
    description:
      "Parque Tingui — percurso tranquilo em área verde, alinhado ao roteiro de parques da rede cicloviária.",
    neighborhood: "São João",
  },
  {
    id: "8",
    name: "Ciclofaixa Av. Batel",
    street: "Av. do Batel",
    coordinates: [
      [-25.4380, -49.2900],
      [-25.4370, -49.2870],
      [-25.4360, -49.2840],
      [-25.4350, -49.2810],
    ],
    length: 2.1,
    type: "ciclofaixa",
    safety: "moderate",
    avgTraffic: "medium",
    description:
      "Ciclofaixa no Batel (eixo comercial). Referência visual próxima ao mapa cicloviário histórico da cidade.",
    neighborhood: "Batel",
  },
  {
    id: "9",
    name: "Ciclovia Av. Comendador Franco",
    street: "Av. Comendador Franco",
    coordinates: [
      [-25.4490, -49.2430],
      [-25.4520, -49.2390],
      [-25.4560, -49.2350],
      [-25.4600, -49.2310],
      [-25.4640, -49.2270],
    ],
    length: 6.5,
    type: "ciclovia",
    safety: "moderate",
    avgTraffic: "medium",
    description:
      "Eixo Comendador Franco em direção ao Aeroporto. Comprimento aproximado; validar na camada GeoCuritiba.",
    neighborhood: "Jardim das Américas",
  },
  {
    id: "10",
    name: "Ciclovia Av. Victor Ferreira do Amaral",
    street: "Av. Victor Ferreira do Amaral",
    coordinates: [
      [-25.4000, -49.2380],
      [-25.3960, -49.2350],
      [-25.3920, -49.2320],
      [-25.3880, -49.2290],
    ],
    length: 3.5,
    type: "ciclofaixa",
    safety: "caution",
    avgTraffic: "medium",
    description:
      "Trecho próximo à UFPR (Tarumã). Ciclofaixa na tipologia IPPUC; geometria esquemática.",
    neighborhood: "Tarumã",
  },
  {
    id: "11",
    name: "Ciclovia Parque Tanguá",
    street: "Parque Tanguá",
    coordinates: [
      [-25.3740, -49.2850],
      [-25.3760, -49.2840],
      [-25.3780, -49.2825],
      [-25.3800, -49.2810],
    ],
    length: 2.0,
    type: "ciclovia",
    safety: "safe",
    avgTraffic: "low",
    description:
      "Entorno do Parque Tanguá (Pilarzinho). Uso misto lazer / deslocamento conforme malha de parques.",
    neighborhood: "Pilarzinho",
  },
  {
    id: "12",
    name: "Ciclovia Av. Presidente Affonso Camargo",
    street: "Av. Presidente Affonso Camargo",
    coordinates: [
      [-25.4360, -49.2550],
      [-25.4330, -49.2530],
      [-25.4300, -49.2510],
      [-25.4270, -49.2490],
      [-25.4240, -49.2470],
    ],
    length: 4.2,
    type: "ciclovia",
    safety: "safe",
    avgTraffic: "medium",
    description:
      "Eixo Affonso Camargo junto à Rodoferroviária. Infraestrutura de ciclovia física na classificação municipal.",
    neighborhood: "Jardim Botânico",
  },
];

export const mockWeather: WeatherData = {
  temperature: 22,
  feelsLike: 20,
  humidity: 68,
  windSpeed: 12,
  windDirection: "SE",
  rain: 0.2,
  condition: "Parcialmente nublado",
  icon: "partly-cloudy",
  updatedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
};

export const mockTrafficHistory: TrafficHistory[] = [
  { hour: "06:00", movement: 15, cyclists: 8 },
  { hour: "07:00", movement: 45, cyclists: 32 },
  { hour: "08:00", movement: 78, cyclists: 55 },
  { hour: "09:00", movement: 62, cyclists: 40 },
  { hour: "10:00", movement: 40, cyclists: 25 },
  { hour: "11:00", movement: 35, cyclists: 20 },
  { hour: "12:00", movement: 50, cyclists: 30 },
  { hour: "13:00", movement: 48, cyclists: 28 },
  { hour: "14:00", movement: 38, cyclists: 22 },
  { hour: "15:00", movement: 42, cyclists: 26 },
  { hour: "16:00", movement: 55, cyclists: 35 },
  { hour: "17:00", movement: 85, cyclists: 60 },
  { hour: "18:00", movement: 92, cyclists: 68 },
  { hour: "19:00", movement: 65, cyclists: 42 },
  { hour: "20:00", movement: 30, cyclists: 18 },
  { hour: "21:00", movement: 15, cyclists: 8 },
];

export const getTrafficLevel = (hour: number): string => {
  if (hour >= 7 && hour <= 9) return "Alto";
  if (hour >= 17 && hour <= 19) return "Alto";
  if (hour >= 11 && hour <= 14) return "Médio";
  return "Baixo";
};

export const getSafetyLabel = (safety: Ciclovia["safety"]) => {
  const map = {
    safe: { label: "Seguro", color: "safe" },
    moderate: { label: "Moderado", color: "warning" },
    caution: { label: "Atenção", color: "danger" },
  };
  return map[safety];
};

export const getTypeLabel = (type: Ciclovia["type"], tipoLabelIppuc?: string) => {
  if (tipoLabelIppuc) return tipoLabelIppuc;
  const map = {
    ciclovia: "Ciclovia",
    ciclofaixa: "Ciclofaixa",
    ciclorrota: "Ciclorrota",
  };
  return map[type];
};
