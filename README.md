# mi-app

App mínima en Node/Express + TypeScript, pensada exclusivamente para probar el pipeline:

- `ci.yaml` → lint, typecheck, tests con cobertura, build de imagen a ECR, scan Trivy.
- `_deploy_reusable.yaml` → deploy a ECS + smoke tests (newman) + rollback automático.
- `deploy-dev.yaml` (o el que uses) → llama al reusable con `environment: dev`.

## Correr localmente

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start          # sirve en http://localhost:3000
curl http://localhost:3000/health
```

## Probar con Docker (igual que el job build-image del CI)

```bash
docker build -t mi-app:local .
docker run -p 3000:3000 mi-app:local
curl http://localhost:3000/health
```

## Cómo encaja con `ci.yaml`

- `npm run lint` / `npm run typecheck` / `npm test -- --coverage` → coinciden 1:1 con los scripts que el CI invoca.
- `jest-junit` genera `junit.xml` en la raíz, que es lo que `dorny/test-reporter` espera (`path: 'junit.xml'`, `reporter: jest-junit`).
- El `Dockerfile` expone el puerto 3000 y trae `HEALTHCHECK` sobre `/health`, coherente con `container-name: mi-app` que usa `_deploy_reusable.yaml` al insertar la imagen en la task definition.

## Cómo encaja con `_deploy_reusable.yaml`

- El endpoint `/health` es lo que usarías como *health check* de la task definition ECS.
- `tests/smoke/dev.postman_collection.json` es la colección que el job `smoke-tests` corre con:
  ```
  npx newman run tests/smoke/dev.postman_collection.json --env-var base_url=https://dev.miapp.com
  ```
  Duplica ese archivo a `staging.postman_collection.json` / `production.postman_collection.json` cuando agregues esos ambientes.

## Pasos sugeridos para probar la integración end-to-end

1. Crea el repo, copia esta carpeta como raíz, y agrega `.github/workflows/ci.yaml`, `.github/workflows/_deploy_reusable.yaml` y `deploy-dev.yaml`.
2. En Settings → Environments, crea `dev` (y opcionalmente protection rules).
3. Configura los secrets/variables necesarios: `DEPLOY_ROLE_ARN`, `TEAMS_WEBHOOK_URL`, y el role de OIDC que usa `ci.yaml` para `aws-actions/configure-aws-credentials`.
4. Necesitas tener ya creados en AWS: repo ECR `mi-app`, cluster ECS, servicio ECS con una task definition inicial llamada `mi-app` (el CI solo hace build+push; el deploy asume que el servicio ya existe).
5. Push a `dev` → dispara `ci.yaml` → build y push de la imagen a ECR.
6. Dispara `deploy-dev.yaml` (manual o encadenado) pasando el `image-tag` que generó el job `build-image` (`steps.meta.outputs.tag`).
7. Verifica en Actions que corran en orden: `deploy` → `smoke-tests` → `notify-success`, o que el `rollback` se dispare si el smoke test falla.

## Notas

- El `Dockerfile` corre como usuario `node` (no root) y usa multi-stage build para no llevar devDependencies a producción.
- Si prefieres probar el rollback a propósito, puedes romper temporalmente el endpoint `/health` (ej. devolver 500) y volver a desplegar, para forzar que falle el smoke test y veas el job `rollback` actuar.

test1
