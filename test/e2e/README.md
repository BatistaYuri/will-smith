# Discord E2E Smoke

Este teste valida o caminho real no Discord sem depender da API da Riot:
- login do bot
- envio de embed
- envio de mensagem com componente (botao)
- limpeza das mensagens criadas

## Variaveis usadas

O E2E usa apenas as variaveis ja existentes no `.env.development`:
- `TOKEN`
- `GUILD_ID`

E usa o canal configurado em `channels.text` (arquivo `src/config/index.js`).

## Execucao

```bash
npm run test:e2e
```

O script ja executa com `NODE_ENV=development`.
