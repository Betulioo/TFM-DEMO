import type { AzdoReader } from "./read-only-client.js";

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  /** Correo de la cuenta, si Azure DevOps lo devuelve. */
  email?: string;
}

interface ConnectionDataResponse {
  authenticatedUser?: {
    id?: string;
    providerDisplayName?: string;
    properties?: { Account?: { $value?: string } };
  };
}

/** Identifica al usuario dueño del token. */
export async function getAuthenticatedUser(reader: AzdoReader): Promise<AuthenticatedUser> {
  // Este endpoint solo existe en versión preview: exige el sufijo "-preview" en api-version.
  const data = await reader.get<ConnectionDataResponse>("_apis/connectionData", { "api-version": "7.1-preview" });
  const user = data.authenticatedUser;
  if (!user?.id) throw new Error("Azure DevOps no devolvió el usuario del token.");

  const account = user.properties?.Account?.$value;
  return {
    id: user.id,
    displayName: user.providerDisplayName ?? "sin nombre",
    email: account && account.includes("@") ? account : undefined,
  };
}
