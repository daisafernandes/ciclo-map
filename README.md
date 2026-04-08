# CicloMap CWB

Mapa da rede cicloviária de Curitiba (referência IPPUC / GeoCuritiba quando configurado).

## Rotas A → B (OSRM)

O app calcula rotas com [OSRM](https://project-osrm.org/). Por padrão usa o proxy `/osrm` (Vite / Vercel) apontando para o servidor público, que **em geral só expõe o perfil `driving`**. Para rotas com perfil de bicicleta (`cycling`, `bicycle`, etc.) é preciso **hospedar uma instância OSRM** com extract OSM e o perfil desejado, e então definir no `.env`:

- `VITE_OSRM_URL` — URL base (sem barra final), ex.: `https://seu-servidor.example`
- `VITE_OSRM_PROFILE` — nome do perfil servido pelo seu OSRM, ex.: `cycling`

Se o perfil não existir no servidor, a API pode responder com código `InvalidUrl` — o app mostra uma mensagem orientando a ajustar o `.env`.

## Parâmetros de URL

Além de `ciclovia`, `bairro`, `tipo`, `seg` e `map`, a rota pode ser compartilhada com:

- `from` — origem `lat,lng` (5 casas decimais)
- `to` — destino no mesmo formato

Se `from` ou `to` estiverem presentes, eles têm prioridade sobre `ciclovia` / `bairro` na carga inicial.

## Elevação

O perfil de elevação usa a API [Open-Elevation](https://open-elevation.com/) (dados SRTM). Opcionalmente defina `VITE_ELEVATION_URL` para outro endpoint compatível (`POST` com o mesmo formato).

## Frontend

Copie `.env.example` para `.env` e ajuste as variáveis. Desenvolvimento: `npm run dev` (porta típica 5173).
