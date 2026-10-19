// Paso 2: comprueba que la configuración de .env permite leer el proyecto de Azure DevOps.
// Solo hace peticiones GET y no imprime el token.
import { loadConfig } from "../src/config.js";
import { AzdoHttpError, AzdoReadOnlyClient } from "../src/azdo/read-only-client.js";
import { getAuthenticatedUser } from "../src/azdo/identity.js";

interface ProjectResponse {
  id: string;
  name: string;
  visibility?: string;
  capabilities?: { processTemplate?: { templateName?: string } };
}

async function main(): Promise<void> {
  const config = loadConfig("AZDO_PAT");
  const client = new AzdoReadOnlyClient(config);

  console.log(`Organización: ${config.orgUrl}`);

  const project = await client.get<ProjectResponse>(`_apis/projects/${encodeURIComponent(config.project)}`, {
    includeCapabilities: "true",
  });
  console.log(`Proyecto:     ${project.name} (${project.visibility ?? "visibilidad desconocida"})`);
  console.log(`Proceso:      ${project.capabilities?.processTemplate?.templateName ?? "sin datos"}`);

  // Identifica al usuario del token: la recogida lo necesitará para filtrar "mis" PRs y tareas.
  try {
    const user = await getAuthenticatedUser(client);
    console.log(`Usuario:      ${user.displayName} (${user.id})`);
  } catch (error) {
    console.log(`Usuario:      no se pudo obtener (${error instanceof Error ? error.message : String(error)})`);
  }

  console.log("\nConexión OK (solo lectura).");
}

main().catch((error: unknown) => {
  if (error instanceof AzdoHttpError && (error.status === 401 || error.status === 403)) {
    console.error(`Error de permisos (${error.status}). Revisa que el token no haya caducado y tenga los permisos de lectura indicados.`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});
