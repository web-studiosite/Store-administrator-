
readme_content = '''# ⛽ Emola Agent Controller

Sistema web completo para gestão de posto de combustível e loja de conveniência, com foco em automação, controle financeiro e clareza total de dados.

## 🚀 Funcionalidades

- **Cadastro de Produtos**: Nome, categoria, quantidade, preço de aquisição e venda
- **Controle de Estoque**: Distinção entre armazém e loja, alertas de estoque baixo
- **Movimentações**: Registro de entradas (reposição) e saídas (vendas)
- **Cálculos Automáticos**: Lucro diário, margens, relatórios por categoria
- **Relatórios**: Diários, semanais, mensais e personalizados
- **Exportação**: JSON e CSV a qualquer momento
- **Modo Offline**: Funciona sem internet usando localStorage
- **Supabase**: Sincronização em nuvem via API REST (sem SDK pesado)

## 📁 Estrutura do Projeto

```
/
├── index.html      # Interface principal
├── style.css       # Design responsivo
├── app.js          # Lógica de interação
├── supabase.js     # Conexão com Supabase
├── formulas.js     # Cálculos de margens e lucros
└── README.md       # Este arquivo
```

## 🛠️ Configuração do Supabase

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL** e a **API Key (anon/public)**

### 2. Criar as tabelas

No SQL Editor do Supabase, execute:

```sql
-- Tabela de Estoque
CREATE TABLE estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    preco_aquisicao DECIMAL(10,2) NOT NULL,
    preco_venda DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Movimentações
CREATE TABLE movimentacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID REFERENCES estoque(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade INTEGER NOT NULL,
    data TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant para acesso via API (anon e authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes TO anon, authenticated;

-- Enable RLS
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas simples (ajuste conforme necessidade de segurança)
CREATE POLICY "Allow all" ON estoque FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON movimentacoes FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ **Nota importante**: A partir de Maio 2026, novos projetos Supabase exigem `GRANT` explícito para expor tabelas na Data API [^3^]. Certifique-se de executar os comandos `GRANT` acima.

### 3. Configurar o sistema

1. Abra o sistema no navegador
2. Vá em **Configurações**
3. Insira a URL do Supabase e a API Key
4. Escolha a moeda (MZN, USD, EUR, etc.)
5. Salve

## 💻 Como usar localmente

### Opção 1: Modo Offline (sem Supabase)

1. Abra `index.html` diretamente no navegador
2. Vá em **Configurações** → **Usar Modo Offline**
3. Os dados serão salvos no `localStorage` do navegador

### Opção 2: Com Supabase

1. Configure o Supabase conforme acima
2. Insira as credenciais em **Configurações**
3. Os dados sincronizarão automaticamente

## 📱 Deploy no GitHub Pages

1. Crie um novo repositório no GitHub
2. Faça upload dos 5 arquivos (`index.html`, `style.css`, `app.js`, `supabase.js`, `formulas.js`)
3. Vá em **Settings** → **Pages**
4. Selecione a branch `main` e pasta `/ (root)`
5. Seu sistema estará disponível em `https://seu-usuario.github.io/nome-repo/`

## 📊 Fluxo de Trabalho

1. **Cadastrar Produtos**: Em "Estoque", preencha o formulário de cadastro
2. **Registrar Entradas**: Em "Movimentações", selecione o produto, tipo "Entrada" e quantidade
3. **Registrar Vendas**: Em "Movimentações", selecione o produto, tipo "Saída" e quantidade
4. **Acompanhar Lucros**: Em "Dashboard" e "Relatórios", visualize os resultados
5. **Exportar**: Em "Relatórios", exporte os dados em JSON ou CSV

## 🎨 Categorias Predefinidas

- Combustível
- Bebidas
- Biscoitos
- Automóveis
- Alimentos
- Higiene
- Outros (adicione novas conforme necessidade)

## 🔒 Segurança

- **Sem build**: Nenhuma ferramenta de build necessária
- **API REST direta**: Conexão via fetch, sem SDK pesado
- **RLS habilitado**: Row Level Security no Supabase
- **Dados locais**: Backup automático no localStorage
- **Exportação**: Possibilidade de exportar dados a qualquer momento

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se as credenciais do Supabase estão corretas
2. Confira se as tabelas foram criadas com os GRANTs necessários
3. Use o Modo Offline se não tiver acesso ao Supabase

---

**Desenvolvido para gestão eficiente de postos de combustível e lojas de conveniência.**
'''

with open('/mnt/agents/output/README.md', 'w', encoding='utf-8') as f:
    f.write(readme_content)

print("README.md criado com sucesso!")
