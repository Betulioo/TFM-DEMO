import { existsSync } from "node:fs";
import type { Thresholds } from "./domain/types.js";

export interface AzdoConfig {
  orgUrl: string;
  project: string;
  pat: string;
}

export type PatVariable = "AZDO_PAT" | "AZDO_PAT_SEED" | "AZDO_PAT_TEAMMATE";

/** Carga `.env` una sola vez (si existe). Las variables ya definidas en el entorno tienen prioridad. */
export function loadEnvFile(): void {
  if (existsSync(".env")) process.loadEnvFile(".env");
}

/**
 * Lee la configuración de conexión.
 * `patVariable` elige el token: el de solo lectura por defecto; los de escritura solo en scripts de la demo.
 */
export function loadConfig(patVariable: PatVariable = "AZDO_PAT"): AzdoConfig {
  loadEnvFile();
  return {
    orgUrl: required("AZDO_ORG_URL").replace(/\/+$/, ""),
    project: required("AZDO_PROJECT"),
    pat: required(patVariable),
  };
}

/** Valores por defecto de docs/glosario.md: son dos umbrales independientes aunque hoy valgan lo mismo. */
const DEFAULT_AGED_PR_DAYS = 3;
const DEFAULT_STALE_TASK_DAYS = 3;
export const DEFAULT_THRESHOLDS: Thresholds = { agedPrDays: DEFAULT_AGED_PR_DAYS, staleTaskDays: DEFAULT_STALE_TASK_DAYS };

/** Umbrales del glosario, configurables en `.env` (`AGED_PR_DAYS`, `STALE_TASK_DAYS`). */
export function loadThresholds(): Thresholds {
  loadEnvFile();
  return thresholdsFrom(process.env);
}

/** Umbrales a partir de unas variables de entorno; separado de `loadThresholds` para probarlo sin `.env`. */
export function thresholdsFrom(environment: NodeJS.ProcessEnv): Thresholds {
  return {
    agedPrDays: thresholdDays(environment, "AGED_PR_DAYS", DEFAULT_AGED_PR_DAYS),
    staleTaskDays: thresholdDays(environment, "STALE_TASK_DAYS", DEFAULT_STALE_TASK_DAYS),
  };
}

function thresholdDays(environment: NodeJS.ProcessEnv, name: string, defaultDays: number): number {
  const value = optionalEnv(name, environment);
  if (value === undefined) return defaultDays;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1) {
    throw new Error(`${name} debe ser un número entero de días, 1 o más (valor actual: "${value}").`);
  }
  return days;
}

export function optionalEnv(name: string, environment: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = environment[name]?.trim();
  return value ? value : undefined;
}

function required(name: string): string {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Falta la variable ${name}. Revisa tu archivo .env (plantilla en .env.example).`);
  }
  return value;
}
