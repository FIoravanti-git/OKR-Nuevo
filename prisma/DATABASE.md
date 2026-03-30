# Modelo de datos OKR multiempresa

Conexión de ejemplo: `postgresql://usuario:clave@localhost:5433/OKR` (ajustar credenciales).

## Relaciones (jerarquía)

```text
plans ──────────────┐
                      │
companies ◄───────────┼── company_subscriptions (N por empresa en el tiempo)
  ├── users
  ├── institutional_projects (1 por empresa)
  │     └── institutional_objectives
  │           └── strategic_objectives
  │                 └── key_results
  │                       └── activities
  │                             └── activity_progress_logs (histórico)
  ├── … (denormalización company_id en cada nivel hijo)
  └── audit_logs
```

## Tablas y propósito

| Tabla | `company_id` | Por qué existe |
|-------|----------------|----------------|
| **plans** | No | Catálogo de productos/planes SaaS reutilizable entre empresas. |
| **companies** | No (es el tenant) | Organización cliente; `slug` único para URLs y API. |
| **company_subscriptions** | Sí | Enlaza empresa ↔ plan con **ciclo de vida** (trial, activo, mora, baja). Permite historial de renovaciones sin perder datos. `ON DELETE RESTRICT` al plan evita borrar planes en uso. |
| **users** | Nullable | `SUPER_ADMIN` sin empresa; resto con `company_id` obligatorio en reglas de app. |
| **institutional_projects** | Sí (único) | Raíz del OKR institucional: misión/visión y estado del “proyecto único” por empresa. |
| **institutional_objectives** | Sí | Objetivos macro del plan institucional; `company_id` duplicado del proyecto acelera consultas `WHERE company_id = ?` y políticas RLS. |
| **strategic_objectives** | Sí | Objetivos estratégicos / OKR clave bajo cada objetivo institucional; soporta `progress_mode` para agregación. |
| **key_results** | Sí | Resultados medibles; pesos y estados (`ON_TRACK`, `AT_RISK`, …). |
| **activities** | Sí | Ejecución táctica; `impacts_progress` implementa la regla de negocio de impacto opcional en el KR. |
| **activity_progress_logs** | Sí | **Append-only**: historial de cambios de avance/estado por actividad (series temporales, auditoría operativa). Sin `updated_at`. |
| **audit_logs** | Nullable | Eventos de dominio/seguridad (`CREATE`, `LOGIN`, …); `company_id` NULL = acción global de plataforma. Sin `updated_at`. |

## Enums

- **UserRole**: roles del producto.
- **SubscriptionStatus**: estado comercial del vínculo empresa–plan.
- **InstitutionalProjectStatus**, **InstitutionalObjectiveStatus**, **StrategicObjectiveStatus**, **KeyResultStatus**, **ActivityStatus**: ciclo de vida en cada capa.
- **ProgressCalculationMode**: cómo la app debe agregar avances desde hijos (ponderado, manual, etc.).
- **AuditAction**: tipificación de eventos en auditoría.

## Índices (resumen)

- Únicos: `companies.slug`, `users.email`, `plans.code`, `institutional_projects.company_id`.
- Compuestos `(company_id, …)` en cada tabla hija: listados y búsquedas multi-tenant sin joins extra.
- `activity_progress_logs (activity_id, created_at)` y `(company_id, created_at)`: timelines y reportes.
- `audit_logs (entity_type, entity_id)` y `(company_id, created_at)`: trazabilidad por entidad o por tenant.

## Restricciones destacadas

- FKs en cascada desde `companies` hacia datos del tenant (borrado limpio).
- `company_subscriptions.plan_id` con **RESTRICT** al borrar plan si hay suscripciones.
- Coherencia `institutional_objectives.company_id` = `institutional_projects.company_id` del proyecto padre: **responsabilidad de la aplicación** (o trigger futuro); el índice compuesto ayuda a validar en batch.

## Fuentes de verdad

- Esquema aplicable vía migraciones: `prisma/migrations/`.
- Script SQL “desde cero”: `scripts/create-okr-database.sql`.
