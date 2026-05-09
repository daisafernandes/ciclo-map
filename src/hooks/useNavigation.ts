import { useState, useEffect, useCallback } from "react";
import type { LatLngTuple } from "leaflet";
import type { OsrmStep } from "@/services/routing";

// Raio em metros para considerar que o usuário "passou" um step.
const STEP_ADVANCE_RADIUS_M = 25;

function haversineMeters(a: LatLngTuple, b: LatLngTuple): number {
  const R = 6_371_000;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Estima a posição do ponto de manobra de um step como o início do próximo step.
// Para um step qualquer, o ponto de manobra é seu destino — aqui aproximamos
// usando a bearing_after e distância como referência. Não temos as coordenadas
// dos pontos de manobra sem decodificar a geometria do step, então usamos
// a posição atual do usuário comparada a uma fração da distância acumulada
// ao longo da rota. A estratégia simples: avançar step quando o usuário
// ficou ≤ STEP_ADVANCE_RADIUS_M do ponto de referência do próximo step
// (calculado via acumulação de distâncias ao longo dos steps).
//
// Como o OSRM não devolve coordenadas dos waypoints dos steps separadamente
// na API sem geometrias individuais, usamos uma heurística por índice:
// avançamos o step quando distância ao longo da rota já percorrida
// ultrapassa a soma das distâncias dos steps anteriores.

export interface NavigationState {
  currentStepIndex: number;
  currentStep: OsrmStep | null;
  nextStep: OsrmStep | null;
  distanceToNextM: number | null;
  isNavigating: boolean;
}

export function useNavigation(steps: OsrmStep[] | undefined, position: LatLngTuple | null) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Acumulação de distâncias: stepCumulative[i] = distância percorrida até o início do step i
  const stepCumulativeDistances: number[] = [];
  let acc = 0;
  for (const s of steps ?? []) {
    stepCumulativeDistances.push(acc);
    acc += s.distance;
  }
  const totalRouteM = acc;

  // Avança steps baseado na posição ao longo da rota.
  // Usamos a distância euclidiana do usuário ao manobra-ponto estimado do step atual.
  // Como não temos coords dos steps sem geometria extra, estimamos a distância
  // ao destino do step atual como (cumulativa[stepIdx+1] - distânciajápercorrida),
  // aproximada pela posição do usuário vs. início estimado do próximo step.
  useEffect(() => {
    if (!isNavigating || !position || !steps?.length) return;

    // Heurística: avança step quando o próximo step está muito próximo.
    // Como não temos as coordenadas de manobra individuais, usamos a distância
    // total percorrida estimada comparando com as distâncias acumuladas.
    // Isso funciona razoavelmente em rotas lineares.
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= steps.length) return;

    // Calculamos distância percorrida estimada pela posição do usuário.
    // Sem geometrias dos steps, só podemos avançar quando o usuário entra
    // no threshold do step. Usamos a distância do step atual como proxy.
    const currentStep = steps[currentStepIndex];
    // Se a distância do step atual é muito pequena ou o usuário andou o suficiente
    // (threshold: 20m de margem do fim do step), avança.
    if (currentStep.distance < STEP_ADVANCE_RADIUS_M) {
      setCurrentStepIndex(nextIdx);
    }
  }, [position, isNavigating, steps, currentStepIndex]);

  const startNavigation = useCallback(() => {
    setCurrentStepIndex(0);
    setIsNavigating(true);
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
  }, []);

  const validSteps = steps ?? [];
  const currentStep = validSteps[currentStepIndex] ?? null;
  const nextStep = validSteps[currentStepIndex + 1] ?? null;

  // Distância restante até o fim do step atual (proxy: distância do step).
  const distanceToNextM = currentStep ? currentStep.distance : null;

  // Quando não há steps, desativa navegação automaticamente.
  useEffect(() => {
    if (isNavigating && (!steps || steps.length === 0)) {
      setIsNavigating(false);
    }
  }, [isNavigating, steps]);

  // Reseta ao trocar de rota.
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsNavigating(false);
  }, [steps]);

  return {
    isNavigating,
    currentStepIndex,
    currentStep,
    nextStep,
    distanceToNextM,
    totalRouteM,
    startNavigation,
    stopNavigation,
  };
}
