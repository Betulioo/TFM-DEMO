export class AzdoHttpError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    detail: string,
  ) {
    super(`Azure DevOps respondió ${status} en ${path}: ${detail}`);
  }
}

/** Extrae el mensaje de error que devuelve Azure DevOps (campo `message` del JSON), recortado. */
export async function errorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === "string" && body.message) return body.message.slice(0, 300);
  } catch {
    // El cuerpo no es JSON: usamos el texto de estado.
  }
  return response.statusText || "sin detalle";
}

export function basicAuthHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;
}
