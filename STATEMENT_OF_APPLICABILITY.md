# STATEMENT OF APPLICABILITY (SoA) — ISO/IEC 27001:2022

**Aplicación:** VetTrack  
**Organización:** AiAppFactory Software Standards  
**Fecha de Emisión:** 2026-11-06  
**Versión:** 1.0 (Audit-Ready)  

> Este documento define formalmente la aplicabilidad y estado de implementación de los controles de seguridad del Anexo A de la norma ISO/IEC 27001:2022 para esta solución de software.

| Control ID | Dominio | Nombre del Control | Aplicable | Estado de Implementación | Justificación Técnica de Cumplimiento |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **A.5.1** | A5 | Policies for information security | SÍ | `IMPLEMENTADO` | Directrices formales documentadas en COMPLIANCE.md y AGENTS.md |
| **A.5.8** | A5 | Information security in project management | SÍ | `IMPLEMENTADO` | Protocolo de Cierre v4 y ciclo de vida de desarrollo seguro |
| **A.5.15** | A5 | Access control policy | SÍ | `IMPLEMENTADO` | Principio de menor privilegio y control de acceso RBAC |
| **A.5.23** | A5 | Information security for use of cloud services | SÍ | `IMPLEMENTADO` | Configuraciones seguras de Firebase / Cloudflare Workers y reglas de base de datos |
| **A.5.29** | A5 | Information security during disruption | SÍ | `IMPLEMENTADO` | Resiliencia offline-first y continuidad operativa |
| **A.6.4** | A6 | Disciplinary process | NO | `EXENTO` | Procedimientos de gestión humana de accesos |
| **A.6.8** | A6 | Information security event reporting | SÍ | `IMPLEMENTADO` | Canal de reporte de incidentes y telemetría de auditoría |
| **A.7.7** | A7 | Clear desk and clear screen | SÍ | `IMPLEMENTADO` | Screen Wake Lock seguro y cierre de sesión por inactividad |
| **A.7.14** | A7 | Secure disposal or re-use of equipment | NO | `EXENTO` | Procedimiento de purga de dispositivos de campo |
| **A.8.1** | A8 | User endpoint devices | SÍ | `IMPLEMENTADO` | PWA blindada para terminales móviles y vehículos |
| **A.8.2** | A8 | Privileged access rights | SÍ | `IMPLEMENTADO` | Supervisión de tokens de un solo uso y credenciales de soporte |
| **A.8.7** | A8 | Protection against malware | SÍ | `IMPLEMENTADO` | Auditoría de dependencias en cadena de suministro (Supply Chain) |
| **A.8.8** | A8 | Management of technical vulnerabilities | SÍ | `IMPLEMENTADO` | Escáner SAST y DAST permanente vía Security Guardian |
| **A.8.9** | A8 | Configuration management | SÍ | `IMPLEMENTADO` | Control de versiones git inmutable y detección de drift |
| **A.8.11** | A8 | Data masking | SÍ | `IMPLEMENTADO` | Ofuscación determinista de PII (Engine #198) |
| **A.8.12** | A8 | Data leakage prevention (DLP) | SÍ | `IMPLEMENTADO` | Aislamiento de secretos en .env y bloqueo de exfiltraciones |
| **A.8.15** | A8 | Logging | SÍ | `IMPLEMENTADO` | Registro inmutable de transacciones y auditoría |
| **A.8.20** | A8 | Network security | SÍ | `IMPLEMENTADO` | Cifrado TLS 1.3 forzado y cabeceras HSTS / CSP |
| **A.8.24** | A8 | Use of cryptography | SÍ | `IMPLEMENTADO` | Firmas criptográficas SHA-256 y hashing de contraseñas |
| **A.8.25** | A8 | Secure development lifecycle | SÍ | `IMPLEMENTADO` | Test Guardian (50+ tests en 5 capas) y Zero Fake Features |
| **A.8.28** | A8 | Secure coding | SÍ | `IMPLEMENTADO` | Prevención estricta de XSS (Zero DOM Sinks) e inyección SQL/NoSQL |

## 📝 Metodología de Mantenimiento Continuo
1. **Auditoría Continua:** Toda modificación de código en la aplicación ejecuta `pnpm run compliance:audit` en el Protocolo de Cierre v4.
2. **Evidencias Criptográficas:** Se mantiene trazabilidad de cada cambio en Git con `compliance:pack` asegurando la inmutabilidad de los registros.
