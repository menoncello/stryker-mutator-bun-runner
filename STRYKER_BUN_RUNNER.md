# StrykerJS Test Runner para Bun

## Visão Geral

Este documento descreve a arquitetura e implementação de um test runner customizado para integrar o StrykerJS com o Bun, permitindo executar testes de mutação em projetos que utilizam o Bun como runtime JavaScript.

## Motivação

- **Bun** é um runtime JavaScript rápido com test runner integrado
- **StrykerJS** é uma ferramenta de mutation testing que precisa de um test runner para executar testes
- Atualmente não existe integração oficial entre StrykerJS e Bun
- A solução padrão usando `command` test runner tem penalidade de performance

## Arquitetura Proposta

### 1. Estrutura do Plugin

```
stryker-bun-runner/
├── src/
│   ├── BunTestRunner.ts          # Classe principal do test runner
│   ├── BunTestRunnerOptions.ts   # Tipos e opções de configuração
│   ├── BunTestAdapter.ts         # Adaptador para comunicação com Bun
│   ├── BunResultParser.ts        # Parser dos resultados do Bun
│   └── index.ts                  # Entry point do plugin
├── test/
│   ├── unit/                     # Testes unitários
│   └── integration/              # Testes de integração
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Interface TestRunner

O plugin deve implementar a interface `TestRunner` do StrykerJS:

```typescript
import { 
  TestRunner, 
  DryRunResult, 
  DryRunOptions, 
  MutantRunOptions, 
  MutantRunResult,
  TestRunnerCapabilities 
} from '@stryker-mutator/api/test-runner';

export class BunTestRunner implements TestRunner {
  private bunProcess: ChildProcess | null = null;
  
  constructor(private options: BunTestRunnerOptions) {}
  
  public async init(): Promise<void> {
    // Validar instalação do Bun
    // Configurar ambiente de teste
  }
  
  public async dryRun(options: DryRunOptions): Promise<DryRunResult> {
    // Executar todos os testes sem mutações
    // Coletar coverage se habilitado
    // Retornar resultado com lista de testes
  }
  
  public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
    // Ativar mutante específico
    // Executar apenas testes relevantes
    // Retornar se mutante foi killed, survived ou timeout
  }
  
  public async dispose(): Promise<void> {
    // Limpar recursos
    // Finalizar processos Bun
  }
  
  public capabilities(): TestRunnerCapabilities {
    return { reloadEnvironment: true };
  }
}
```

### 3. Integração com Bun

#### 3.1 Execução de Testes

```typescript
class BunTestAdapter {
  async runTests(testFiles: string[], options: BunRunOptions): Promise<BunTestResult> {
    const args = ['test'];
    
    // Adicionar arquivos específicos
    if (testFiles.length > 0) {
      args.push(...testFiles);
    }
    
    // Adicionar opções do Bun
    if (options.timeout) {
      args.push('--timeout', options.timeout.toString());
    }
    
    if (options.bail) {
      args.push('--bail');
    }
    
    // Executar Bun
    const result = await execa('bun', args, {
      env: {
        ...process.env,
        __STRYKER_ACTIVE_MUTANT__: options.activeMutant?.toString()
      }
    });
    
    return this.parseResult(result);
  }
}
```

#### 3.2 Ativação de Mutantes

Para ativar mutantes específicos durante os testes:

```typescript
// No código sendo testado
declare global {
  interface Window {
    __stryker__: {
      activeMutant: number;
    };
  }
}

// Hook para ativar mutante
if (typeof globalThis.__stryker__ !== 'undefined') {
  const activeMutant = globalThis.__stryker__.activeMutant;
  // Lógica de ativação do mutante
}
```

### 4. Coverage Analysis

Para melhor performance, implementar análise de cobertura:

```typescript
interface BunCoverageCollector {
  async collectCoverage(testResult: BunTestResult): Promise<MutantCoverage> {
    // Extrair informação de cobertura do Bun
    // Mapear para formato esperado pelo Stryker
    return {
      perTest: {
        [testId]: {
          [mutantId]: true
        }
      }
    };
  }
}
```

### 5. Configuração

#### 5.1 Configuração no Stryker

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    "testFiles": ["**/*.test.{js,ts,jsx,tsx}"],
    "timeout": 10000,
    "bail": false,
    "coverageAnalysis": "perTest",
    "nodeArgs": ["--no-warnings"]
  }
}
```

#### 5.2 Opções do Plugin

```typescript
interface BunTestRunnerOptions {
  testFiles?: string[];         // Padrão de arquivos de teste
  timeout?: number;              // Timeout por teste em ms
  bail?: boolean;                // Parar na primeira falha
  coverageAnalysis?: 'off' | 'all' | 'perTest';
  nodeArgs?: string[];           // Argumentos adicionais para o Bun
  env?: Record<string, string>;  // Variáveis de ambiente
}
```

## Implementação Detalhada

### 1. DryRun Implementation

```typescript
public async dryRun(options: DryRunOptions): Promise<DryRunResult> {
  try {
    // Executar todos os testes
    const testResult = await this.bunAdapter.runTests([], {
      timeout: options.timeout,
      coverage: options.coverageAnalysis !== 'off'
    });
    
    // Processar resultados
    const tests = testResult.tests.map(test => ({
      id: test.id,
      name: test.name,
      timeSpentMs: test.duration,
      status: this.mapTestStatus(test.status)
    }));
    
    // Coletar cobertura se habilitado
    let mutantCoverage = undefined;
    if (options.coverageAnalysis !== 'off') {
      mutantCoverage = await this.coverageCollector.collect(testResult);
    }
    
    return {
      status: DryRunStatus.Complete,
      tests,
      mutantCoverage
    };
  } catch (error) {
    return {
      status: DryRunStatus.Error,
      errorMessage: error.message
    };
  }
}
```

### 2. MutantRun Implementation

```typescript
public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
  try {
    // Configurar ambiente com mutante ativo
    const env = {
      __STRYKER_ACTIVE_MUTANT__: options.activeMutant.id.toString()
    };
    
    // Executar apenas testes relevantes
    const testFiles = options.testFilter || [];
    const testResult = await this.bunAdapter.runTests(testFiles, {
      timeout: options.timeout,
      bail: true,
      env
    });
    
    // Determinar resultado do mutante
    if (testResult.failed > 0) {
      return {
        status: MutantRunStatus.Killed,
        failedTests: testResult.failedTests.map(t => t.name),
        nrOfTests: testResult.total
      };
    }
    
    return {
      status: MutantRunStatus.Survived,
      nrOfTests: testResult.total
    };
  } catch (error) {
    if (error.timedOut) {
      return {
        status: MutantRunStatus.Timeout
      };
    }
    throw error;
  }
}
```

### 3. Parser de Resultados

```typescript
class BunResultParser {
  parse(output: string): BunTestResult {
    // Parser do output do Bun test
    // Formato esperado: TAP ou JSON
    const lines = output.split('\n');
    const tests: TestResult[] = [];
    let passed = 0;
    let failed = 0;
    
    for (const line of lines) {
      if (line.startsWith('✓')) {
        // Test passou
        const match = /✓ (.+) \((\d+)ms\)/.exec(line);
        if (match) {
          tests.push({
            name: match[1],
            status: 'passed',
            duration: parseInt(match[2])
          });
          passed++;
        }
      } else if (line.startsWith('✗')) {
        // Test falhou
        const match = /✗ (.+)/.exec(line);
        if (match) {
          tests.push({
            name: match[1],
            status: 'failed'
          });
          failed++;
        }
      }
    }
    
    return {
      tests,
      passed,
      failed,
      total: passed + failed
    };
  }
}
```

## Otimizações de Performance

### 1. Reuso de Processo

Manter processo Bun vivo entre execuções quando possível:

```typescript
class BunProcessPool {
  private processes: Map<string, ChildProcess> = new Map();
  
  async getProcess(workerId: string): Promise<ChildProcess> {
    if (!this.processes.has(workerId)) {
      const process = spawn('bun', ['test', '--watch'], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });
      this.processes.set(workerId, process);
    }
    return this.processes.get(workerId)!;
  }
}
```

### 2. Test Filtering

Executar apenas testes que cobrem o mutante:

```typescript
function filterTestsForMutant(
  mutant: Mutant, 
  coverage: MutantCoverage
): string[] {
  const coveringTests = [];
  
  for (const [testId, mutants] of Object.entries(coverage.perTest)) {
    if (mutants[mutant.id]) {
      coveringTests.push(testId);
    }
  }
  
  return coveringTests;
}
```

### 3. Parallel Execution

Aproveitar concorrência do StrykerJS:

```typescript
public capabilities(): TestRunnerCapabilities {
  return {
    reloadEnvironment: false,  // Reusar ambiente quando possível
    concurrent: true           // Suporta execução paralela
  };
}
```

## Tratamento de Erros

### 1. Validação de Ambiente

```typescript
async validateBunInstallation(): Promise<void> {
  try {
    const { stdout } = await execa('bun', ['--version']);
    if (!semver.gte(stdout.trim(), '1.0.0')) {
      throw new Error('Bun version 1.0.0 or higher required');
    }
  } catch (error) {
    throw new Error('Bun not found. Please install Bun: https://bun.sh');
  }
}
```

### 2. Timeouts

```typescript
async runWithTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError()), timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
}
```

## Exemplo de Uso

### 1. Instalação

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner
```

### 2. Configuração (stryker.config.json)

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "bun": {
    "testFiles": ["**/*.test.ts"],
    "timeout": 30000,
    "coverageAnalysis": "perTest"
  },
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}
```

### 3. Execução

```bash
npx stryker run
```

## Roadmap de Desenvolvimento

### Fase 1: MVP (2-3 semanas)
- [ ] Implementar TestRunner básico
- [ ] Suporte para command runner
- [ ] Testes básicos funcionando

### Fase 2: Otimizações (2-3 semanas)
- [ ] Coverage analysis
- [ ] Test filtering
- [ ] Reuso de processo

### Fase 3: Features Avançadas (3-4 semanas)
- [ ] Watch mode
- [ ] Snapshot testing
- [ ] Source maps support
- [ ] Reporter customizado

### Fase 4: Polish (1-2 semanas)
- [ ] Documentação completa
- [ ] Exemplos
- [ ] CI/CD
- [ ] Publicação NPM

## Considerações Técnicas

### 1. Compatibilidade
- Bun >= 1.0.0
- StrykerJS >= 7.0.0
- Node.js >= 16 (para StrykerJS)

### 2. Limitações Conhecidas
- Coverage analysis pode ter overhead inicial
- Alguns features do Jest podem não ser suportados
- Mutações em arquivos TypeScript requerem transpilação

### 3. Alternativas Consideradas
- Usar command runner (simples mas lento)
- Fork do Jest runner (complexo devido diferenças)
- Wrapper sobre test runner do Node.js (limitado)

## Conclusão

Este design proporciona uma integração eficiente entre StrykerJS e Bun, aproveitando as capacidades de ambas ferramentas. A implementação focada em performance e compatibilidade permitirá que projetos usando Bun possam beneficiar-se de mutation testing sem sacrificar velocidade.