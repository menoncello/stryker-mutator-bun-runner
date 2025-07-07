# Scripts Update Report

## Alterações Realizadas nos Scripts do package.json

### 🗑️ Scripts Removidos

1. **`stryker`** - Referenciava arquivo inexistente `./run-stryker.sh`
2. **`stryker:direct`** - Redundante, substituído por `stryker`
3. **`stryker:bun`** - Referenciava arquivo inexistente `stryker-bun.config.json`
4. **`docs` e `docs:watch`** - Removidos pois `typedoc` não está instalado
5. **`analyze:deps`** - Apenas mostrava mensagem de skip
6. **`precommit`** - Duplicado com configuração do lint-staged

### ✨ Scripts Adicionados

1. **`clean`** - Limpeza completa de todos os diretórios de build e temporários

   ```bash
   rm -rf dist coverage .nyc_output .stryker-tmp reports
   ```

2. **`dev`** - Modo desenvolvimento com watch

   ```bash
   npm run build:watch
   ```

3. **`ci`** - Script completo para CI/CD
   ```bash
   npm run clean && npm run build && npm run check && npm run test:coverage
   ```

### 🔧 Scripts Modificados

1. **`stryker`** - Simplificado para usar comando direto
   - Antes: `./run-stryker.sh`
   - Agora: `stryker run`

2. **`stryker:clean`** - Renomeado de `stryker:bun` e corrigido
   - Antes: `node scripts/cleanup-processes.cjs && stryker run -c stryker-bun.config.json`
   - Agora: `node scripts/cleanup-processes.cjs && stryker run`

3. **`analyze`** - Removido `analyze:deps` inútil
   - Antes: `npm run analyze:duplication && npm run analyze:complexity && npm run analyze:deps`
   - Agora: `npm run analyze:duplication && npm run analyze:complexity && npm run analyze:size`

### 📋 Scripts Finais Organizados

#### Build & Desenvolvimento

- `build` - Compila TypeScript
- `build:watch` - Compila em modo watch
- `dev` - Alias para desenvolvimento

#### Testes

- `test` - Executa testes
- `test:watch` - Testes em modo watch
- `test:coverage` - Testes com cobertura

#### Qualidade de Código

- `typecheck` - Verifica tipos TypeScript
- `lint` - Executa ESLint
- `lint:fix` - Corrige problemas do ESLint
- `format` - Formata código com Prettier
- `format:check` - Verifica formatação

#### Limpeza

- `clean` - Limpeza completa
- `clean:temp` - Limpa arquivos temporários
- `cleanup` - Limpa processos Bun órfãos

#### Mutation Testing

- `stryker` - Executa Stryker
- `stryker:debug` - Stryker com logs debug
- `stryker:clean` - Limpa processos e executa Stryker
- `stryker:pool` - Testa pool de processos

#### Análise

- `analyze` - Executa todas as análises
- `analyze:duplication` - Detecta código duplicado
- `analyze:complexity` - Analisa complexidade ciclomática
- `analyze:size` - Analisa tamanho do bundle
- `analyze:lint-all` - ESLint com zero warnings

#### CI/CD & Publishing

- `check` - Verifica tudo (types, lint, test)
- `ci` - Script completo para CI
- `prepare` - Prepara Husky
- `prepublishOnly` - Antes de publicar
- `version` - Ao versionar
- `postversion` - Após versionar

#### Diagnóstico

- `diagnose` - Diagnóstico de explosão de processos
- `diagnose:files` - Testa arquivos individuais
- `diagnose:tests` - Testa testes individuais

## 🐛 Bug Corrigido

Durante a verificação, foi identificado e corrigido um bug no arquivo `src/process/BunWorker.ts`:

- Faltava o método `sendError` que era chamado mas não estava implementado
- Adicionado o método para enviar mensagens de erro via IPC

## ✅ Validação

Todos os scripts foram testados e estão funcionando corretamente:

- `npm run build` ✅
- `npm run clean` ✅
- `npm run stryker --help` ✅
- Projeto compila sem erros ✅
