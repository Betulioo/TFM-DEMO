import { existsSync } from "node:fs";

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
