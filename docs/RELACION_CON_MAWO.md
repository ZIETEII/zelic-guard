# Relación entre este repositorio y Mawo

Documento de contexto, verificado contra el código el 2026-07-31. Está en español
porque describe la relación entre proyectos internos de LogVox; los documentos de
especificación del repositorio siguen en inglés.

## Resumen

Este repositorio **no está conectado a Mawo, y no debería estarlo.** Mawo tiene su
propia implementación de ZELIC Guard, más completa, con persistencia real.

Son dos implementaciones separadas del mismo concepto. El hilo entre ambas es de
marca, no de código.

## Dónde vive cada una

| | Este repositorio | Mawo |
|---|---|---|
| Ruta | `05_Automatizaciones/Proyectos/OpenAI_Build_Week_2026/zelic-guard` | `~/Desktop/Mawo` |
| Paquete | aplicación Next.js completa | `packages/guard` (`@logvox/guard`) |
| Propósito | demostración pública para Build Week | capa de autoridad en producción |

En Mawo el guard lo consumen `tool-gateway`, `control-plane`, `onboarding`,
`agent-testing` e `inbox`.

## Diferencias verificadas

| | Este repositorio | Mawo `packages/guard` |
|---|---|---|
| Reglas | 10 | 14 |
| Historial anti-replay | lo envía el cliente en cada petición | PostgreSQL, transaccional con RLS |
| Multiempresa | no | sí, por organización |
| Al denegar | muestra el veredicto | lanza `GUARD_DENIED`; la herramienta no se ejecuta |
| Auditoría | eventos en memoria de React | tabla persistida |
| Alcance | un caso sembrado (factura por correo) | genérico multi-herramienta |

Reglas que Mawo añade: `input_valid`, `contract_fingerprint_valid`,
`contract_id_matches`, `organization_matches`, `agent_version_matches`,
`request_not_future`. Además renombra `*_matches` a `*_allowed`.

## El punto que más importa

`docs/SECURITY.md` de este repositorio ya advierte que una integración de
producción debe persistir el consumo de replay detrás de la interfaz
`ExecutionHistory`. **Mawo ya lo hace.**

En `packages/tool-gateway/src/gateway.ts:545`, el servidor obtiene el historial
por su cuenta antes de evaluar:

```ts
const history = await this.dependencies.guard.history(
  organizationId, contract.id, requestId
);
const verdict = evaluateExecution({ contract, attempt, now, history });
if (verdict.verdict !== "ALLOW") {
  throw new ToolGatewayError("GUARD_DENIED", ...);
}
```

El historial sale de la tabla `toolExecutions` dentro de una transacción con
scope de tenant (`db/adapters/tool-gateway.ts`). El agente nunca declara su
propio historial, así que no puede revivir una ejecución ya consumida.

En este repositorio, en cambio, el navegador envía `history` en cada llamada a
`/api/evaluate`. Es adecuado para un sandbox público sin estado, pero significa
que aquí la protección anti-replay es demostrativa, no efectiva.

## Consecuencia práctica

No tiene sentido agregarle persistencia a este repositorio para "conectarlo" con
Mawo: duplicaría lo que Mawo ya resuelve mejor. Este repositorio cumple su
función como demostración del concepto — sandbox sin login, sin base de datos,
con la narrativa completa y el motor determinista a la vista.

Según el manual de marca, Mawo *opera* agentes y ZELIC Guard es una capacidad
transversal que *autoriza* (§1.1, §1.7). La forma correcta de expresar la
relación es el sello `Protected by ZELIC Guard`, no una llamada de red.

## Pendiente por verificar

Este repositorio tiene dos reglas que Mawo no tiene: `recipient_allowed` y
`resource_matches`. Como Mawo opera conectores de WhatsApp y Google Calendar,
queda por confirmar dónde valida que un agente no envíe a un destinatario no
aprobado. Puede estar cubierto por la allowlist estricta del Tool Gateway o por
los propios conectores; no se ha revisado.
