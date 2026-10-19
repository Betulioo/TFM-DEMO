import type { AzdoConfig } from "../config.js";
import { AzdoHttpError, basicAuthHeader, errorDetail } from "./errors.js";

export { AzdoHttpError } from "./errors.js";

export const API_VERSION = "7.1";

/** Lo mínimo que necesita cualquier código que solo lee de Azure DevOps. */
export interface AzdoReader {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
}

/**
 * Cliente HTTP de SOLO LECTURA para Azure DevOps.
 * Solo existe el método `get`: la restricción está en el código, no solo en las instrucciones.
 * Los mensajes de error nunca incluyen el token.
 */
export class AzdoReadOnlyClient implements AzdoReader {
  private readonly authHeader: string;

  constructor(private readonly config: AzdoConfig) {
    this.authHeader = basicAuthHeader(config.pat);
  }

  get project(): string {
    return this.config.project;
  }

  /** `path` es relativo a la organización, p. ej. `_apis/projects/MiProyecto`. */
  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.config.orgUrl}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    if (!url.searchParams.has("api-version")) url.searchParams.set("api-version", API_VERSION);

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: this.authHeader, Accept: "application/json" },
    });

    if (!response.ok) {
      throw new AzdoHttpError(response.status, url.pathname, await errorDetail(response));
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      // Con un token inválido o caducado Azure DevOps puede devolver una página HTML de inicio de sesión.
      throw new AzdoHttpError(response.status, url.pathname, "la respuesta no es JSON (¿token inválido, caducado o sin permisos?)");
    }

    return (await response.json()) as T;
  }
}
