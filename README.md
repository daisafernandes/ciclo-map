# CicloMap CWB

Mapa da rede cicloviária de Curitiba (referência IPPUC / GeoCuritiba quando configurado).

## Rotas A → B (OSRM)

O app calcula rotas com [OSRM](https://project-osrm.org/) usando sempre o perfil **`cycling`** (rede para bicicleta em dados OSM). Por padrão usa o proxy `/osrm` (Vite / Vercel) apontando para o servidor público, que **pode não expor `cycling`**. Nesse caso é preciso **hospedar uma instância OSRM** com extract OSM e perfil de bicicleta, e definir no `.env`:

- `VITE_OSRM_URL` — URL base (sem barra final), ex.: `https://seu-servidor.example`

Se o perfil não existir no servidor, a API pode responder com código `InvalidUrl` — o app mostra uma mensagem a indicar instância própria e `VITE_OSRM_URL`.

Há ainda o modo **rede IPPUC** (só ciclovias carregadas no mapa): o traço segue a geometria da camada; é mais útil com `VITE_CICLOVIAS_LIVE_URL` e pontos encostados aos trechos. Sem caminho na rede, o app mostra erro e sugere usar rota OSRM.

## Parâmetros de URL

Além de `ciclovia`, `bairro`, `tipo`, `seg` e `map`, a rota pode ser compartilhada com:

- `from` — origem `lat,lng` (5 casas decimais)
- `to` — destino no mesmo formato
- `rnet` — `i` = rota só na rede IPPUC (ciclovias do mapa); `o` = OSRM (rede viária, sempre perfil bicicleta). Com `from`/`to`/`route` mas **sem** `rnet`, trata-se como link antigo (OSRM). Sem rota na URL, o modo padrão ao abrir o mapa é a rede IPPUC.

Se `from` ou `to` estiverem presentes, eles têm prioridade sobre `ciclovia` / `bairro` na carga inicial.

## Elevação

O perfil de elevação usa a API [Open-Elevation](https://open-elevation.com/) (dados SRTM). Opcionalmente defina `VITE_ELEVATION_URL` para outro endpoint compatível (`POST` com o mesmo formato).

## Frontend

Copie `.env.example` para `.env` e ajuste as variáveis. Desenvolvimento: `npm run dev` (porta típica 5173).
