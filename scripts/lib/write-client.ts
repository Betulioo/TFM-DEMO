// Cliente con ESCRITURA. Solo lo usan los scripts que siembran el proyecto demo.
// Vive en scripts/ a propósito: el código de src/ nunca debe poder escribir en Azure DevOps.
import { API_VERSION, type AzdoReader } from "../../src/adapters/azdo/read-only-client.js";
import { AzdoHttpError, basicAuthHeader, errorDetail } from "../../src/adapters/azdo/errors.js";

type Method = "GET" | "POST" | "PATCH" | "PUT";

interface RequestOptions {
  body?: unknown;
  params?: Record<string, string>;
  contentType?: string;
}

export class AzdoWriteClient implements AzdoReader {
  private readonly authHeader: string;

  constructor(
    private readonly orgUrl: string,
    pat: string,
  ) {
    this.authHeader = basicAuthHeader(pat);
  }

  get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.orgUrl}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(options.params ?? {})) url.searchParams.set(key, value);
    if (!url.searchParams.has("api-version")) url.searchParams.set("api-version", API_VERSION);

    const headers: Record<string, string> = { Authorization: this.authHeader, Accept: "application/json" };
    if (options.body !== undefined) headers["Content-Type"] = options.contentType ?? "application/json";

    const response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      throw new AzdoHttpError(response.status, `${method} ${url.pathname}`, await errorDetail(response));
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }
}
