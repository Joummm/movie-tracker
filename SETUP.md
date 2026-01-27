# Media Tracker - Guia de Instalação

Este guia explica como configurar e executar o projeto localmente e como fazer deploy em diferentes plataformas.

## Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Supabase (https://supabase.com)
- Git

## Configuração do Supabase

### 1. Criar um projeto no Supabase

1. Aceda a https://supabase.com e crie uma conta
2. Crie um novo projeto
3. Guarde as seguintes credenciais:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)

### 2. Executar os scripts SQL

No SQL Editor do Supabase, execute os scripts na seguinte ordem:

```sql
-- Execute cada ficheiro da pasta /scripts na ordem numérica:
-- 001_create_tables.sql
-- 002_profile_trigger.sql
-- 003_make_episode_title_optional.sql
-- 004_add_series_completed_field.sql
-- 005_add_release_year.sql
-- 006_add_series_status.sql
-- 007_flexible_dates_and_optional_names.sql
-- 008_create_lists_table.sql
-- 009_series_structure.sql
```

### 3. Configurar Autenticação

1. No Supabase Dashboard, vá para Authentication > URL Configuration
2. Configure o Site URL para o seu domínio (ex: `http://localhost:3000` para desenvolvimento)
3. Adicione URLs de redirecionamento permitidos

## Instalação Local

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd media-tracker
```

### 2. Instalar dependências

```bash
# Com npm
npm install

# Com Bun
bun install
```

### 3. Configurar variáveis de ambiente

Crie um ficheiro `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 4. Executar em modo de desenvolvimento

```bash
# Com npm
npm run dev

# Com Bun
bun dev
```

O projeto estará disponível em `http://localhost:3000`

## Build para Produção

```bash
# Com npm
npm run build

# Com Bun
bun run build
```

## Deploy

### Vercel (Recomendado)

1. Faça push do código para um repositório GitHub
2. Aceda a https://vercel.com e importe o repositório
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático

### Netlify

**Nota**: O Netlify requer configuração adicional para projetos Next.js.

1. Instale o plugin Netlify para Next.js:

   ```bash
   npm install @netlify/plugin-nextjs
   ```

2. Crie um ficheiro `netlify.toml` na raiz:

   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

3. No painel do Netlify:
   - Conecte o repositório GitHub
   - Configure as variáveis de ambiente (mesmas do `.env.local`)
   - Deploy

### Configuração do Supabase para Produção

1. No Supabase Dashboard, vá para Authentication > URL Configuration
2. Atualize o Site URL para o domínio de produção
3. Adicione o domínio de produção aos URLs de redirecionamento permitidos

## Estrutura do Projeto

```
/app                    # Páginas e rotas (Next.js App Router)
  /auth                 # Páginas de autenticação
  /content              # Páginas de conteúdo
  /dashboard            # Dashboard principal
  /lists                # Listas personalizadas
  /series               # Páginas de séries
  /settings             # Definições e Export/Import

/components             # Componentes React
  /content              # Componentes de conteúdo
  /dashboard            # Componentes da dashboard
  /layout               # Componentes de layout
  /series               # Componentes de séries
  /ui                   # Componentes UI base (shadcn)

/lib                    # Utilitários e configurações
  /supabase             # Clientes Supabase
  /types                # Tipos TypeScript

/scripts                # Scripts SQL para o Supabase
```

## Funcionalidades

- Autenticação com email/password
- Dashboard com estatísticas
- Gestão de filmes, shorts e outros conteúdos
- Gestão de séries com temporadas e episódios
- Estrutura de episódios para planear antes de assistir
- Listas personalizadas
- Sistema de datas flexível (dia, mês ou ano)
- Filtros por tipo, data, avaliação
- Export/Import de dados (JSON)
- Design responsivo (desktop e mobile)

## Problemas Comuns

### Erro de autenticação

- Verifique se as variáveis de ambiente estão corretas
- Confirme que os URLs de redirecionamento estão configurados no Supabase

### Tabelas não existem

- Execute os scripts SQL na ordem correta
- Verifique se está no projeto Supabase correto

### Erro de CORS

- Verifique se o domínio está nas configurações de URL do Supabase

## Suporte

Para questões ou problemas, abra uma issue no repositório do projeto.

Preciso que para além do tipo de data existente haja um que seja data desconhecida, para permitir que o utilizador adicione um conteudo que assistiu mas não sabe quando

Preciso de adiconar Atores, que podem ser associados a todos os conteudos, e vão ter uma página prórpia para ver as informações deles, ter a possibilidade de editar o perfil dele e ver as produções da qual ele participou.

Preciso de adicionar a opção de adicionar Podcasts, ou seja ter um sistema parecido com as séries mas para os Podcasts

Preciso que alteres os campos Nome para que sejam opcionais (inclusive na base de dados)

Preciso que seja possivel criar do género de uma série para o tipo outros, se quiser adicionar uma lista de conteudos que estão em conjunto mas não é uma série.

Preciso que todos os conteúdos tenham páginas em específico que abrem quando se clica no card dela na lista de conteúdos, que vai apresentar todos os dados relativos aquele conteúdo

Preciso permitir adicionar uma crítica como opcional aos conteúdos.

Preciso que nas séries me permita criar a estrutura toda da série ou seja dizer quantas temporadas são quantos episodios têm, as informações de nome, duração e assim que dá para adicionar para eles, e depois permitir-me apenas clicar num botão quando for assistido para colocar o resto das informações e mover para visto.

Preciso de ter a possibilidade de que um mesmo conteúdo tenha várias visualizações ou seja quando eu vir outra vez posso adicionar uma nova data de visualização, mantendo a outra/as

Preciso que a opção de exportar e importar toda a informação de uma conta continue a funcionar com as novas mudanças
