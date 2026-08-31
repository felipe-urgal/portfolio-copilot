const action = process.argv[2] ?? "status";

const message =
  "Produção permanece desabilitada: conclua os gates de segurança, backup/DR, observabilidade, tenancy/LGPD e o Regulatory Gate aplicável antes de habilitar deploy.";

if (action === "status") {
  console.log(message);
  console.log("production.enabled=false");
  process.exitCode = 0;
} else if (action === "deploy") {
  console.error(message);
  process.exitCode = 2;
} else {
  console.error(`Ação de produção desconhecida: ${action}`);
  process.exitCode = 2;
}
