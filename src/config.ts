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

/** Valor por defecto de los dos umbrales (docs/glosario.md). */
const DEFAULT_THRESHOLD_DAYS = 3;

/** Umbrales del glosario, configurables en `.env` (`AGED_PR_DAYS`, `STALE_TASK_DAYS`). */
export function loadThresholds(): Thresholds {
  loadEnvFile();
  return thresholdsFrom(process.env);
}

/** Umbrales a partir de unas variables de entorno; separado de `loadThresholds` para probarlo sin `.env`. */
export function thresholdsFrom(environment: NodeJS.ProcessEnv): Thresholds {
  return {
    agedPrDays: thresholdDays(environment, "AGED_PR_DAYS"),
    staleTaskDays: thresholdDays(environment, "STALE_TASK_DAYS"),
  };
}

function thresholdDays(environment: NodeJS.ProcessEnv, name: string): number {
  const value = environment[name]?.trim();
  if (!value) return DEFAULT_THRESHOLD_DAYS;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1) {
    throw new Error(`${name} debe ser un número entero de días, 1 o más (valor actual: "${value}").`);
  }
  return days;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function required(name: string): string {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Falta la variable ${name}. Revisa tu archivo .env (plantilla en .env.example).`);
  }
  return value;
}
