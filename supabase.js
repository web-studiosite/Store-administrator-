
supabase_content = '''// supabase.js - Conexão com Supabase via API REST
// Emola Agent Controller

const SupabaseAPI = {
    config: {
        url: localStorage.getItem('supabase_url') || '',
        key: localStorage.getItem('supabase_key') || '',
        modoOffline: localStorage.getItem('modo_offline') === 'true'
    },

    // Verificar se está configurado
    isConfigurado: () => {
        return SupabaseAPI.config.url && SupabaseAPI.config.key && !SupabaseAPI.config.modoOffline;
    },

    // Headers padrão para requisições
    getHeaders: () => ({
        'apikey': SupabaseAPI.config.key,
        'Authorization': `Bearer ${SupabaseAPI.config.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }),

    // Operações no Supabase (ou localStorage se offline)
    
    // ===== ESTOQUE =====
    
    async listarProdutos() {
        if (SupabaseAPI.config.modoOffline || !SupabaseAPI.isConfigurado()) {
            return JSON.parse(localStorage.getItem('emola_estoque') || '[]');
        }

        try {
            const response = await fetch(`${SupabaseAPI.config.url}/rest/v1/estoque?order=id`, {
                method: 'GET',
                headers: SupabaseAPI.getHeaders()
            });
            if (!response.ok) throw new Error('Erro ao buscar estoque');
            return await response.json();
        } catch (error) {
            console.warn('Erro Supabase, usando localStorage:', error);
            return JSON.parse(localStorage.getItem('emola_estoque') || '[]');
        }
    },

    async criarProduto(produto) {
        if (SupabaseAPI.config.modoOffline || !SupabaseAPI.isConfigurado()) {
            const produtos = JSON.parse(localStorage.getItem('emola_estoque') || '[]');
            produto.id = Formulas.gerarId();
            produto.created_at = new Date().toISOString();
            produtos.push(produto);
            localStorage.setItem('emola_estoque', JSON.stringify(produtos));
            return produto;
        }

        try {
            const response = await fetch(`${SupabaseAPI.config.url}/rest/v1/estoque`, {
                method: 'POST',
                headers: SupabaseAPI.getHeaders(),
                body: JSON.stringify(produto)
            });
            if (!response.ok) throw new Error('Erro ao criar produto');
            return await response.json();
        } catch (error) {
            console.warn('Erro Supabase, salvando local:', error);
            const produtos = JSON.parse(localStorage.getItem('emola_estoque') || '[]');
            produto.id = Formulas.gerarId();
            produto.created_at = new Date().toISOString();
            produtos.push(produto);
            localStorage.setItem('emola_estoque', JSON.stringify(produtos));
            return produto;
        }
    },

    async atualizarProduto(id, dados) {
        if (SupabaseAPI.config.modoOffline || !SupabaseAPI.isConfigurado()) {
            const produtos = JSON.parse(localStorage.getItem('emola_estoque') || '[]');
            const index = produtos.findIndex(p => p.id === id);
            if (index !== -1) {
                produtos[index] = { ...produtos[index], ...dados };
                localStorage.setItem('emola_estoque', JSON.stringify(produtos));
                return produtos[index];
            }
            return null;
        }

        try {
            const response = await fetch(`${SupabaseAPI.config.url}/rest/v1/estoque?id=eq.${id}`, {
                method: 'PATCH',
                headers: SupabaseAPI.getHeaders(),
                body: JSON.stringify(dados)
            });
            if (!response.ok) throw new Error('Erro ao atualizar produto');
            return await response.json();
        } catch (error) {
            console.warn('Erro Supabase, atualizando local:', error);
            const produtos = JSON.parse(localStorage.getItem('emola_estoque') || '[]');
            const index = produtos.findIndex(p => p.id === id);
            if (index !== -1) {
                produtos[index] = { ...produtos[index], ...dados };
                localStorage.setItem('emola_estoque', JSON.stringify(produtos));
                return produtos[index];
            }
            return null;
        }
    },

    async deletarProduto(id) {
        if (SupabaseAPI.config.modoOffline || !SupabaseAPI.isConfigurado()) {
            const produtos = JSON.parse(localStorage.getItem('emola_estoque') || '[]');
            const filtrados = produtos.filter(p => p.id !== id);
            localStorage.setItem('emola_estoque', JSON.stringify(filtrados));
            return true;
        }

        try {
            const response = await fetch(`${SupabaseAPI.config.url}/rest/v1/estoque?id=eq.${id}`, {
                method: 'DELETE',
                headers: SupabaseAPI.getHeaders()
            });
            if (!response.ok) throw new Error('Erro ao deletar produto');
            return true;
        } catch (error) {
            console.warn('Erro Supabase, deletando local:', error);
            const produtos = JSON.parse(localStorage.getItem('emola_estoque') || '[]');
            const filtrados = produtos.filter(p => p.id !== id);
            localStorage.setItem('emola_estoque', JSON.stringify(filtrados));
            return true;
        }
    },

    // ===== MOVIMENTAÇÕES =====

    async listarMovimentacoes() {
        if (SupabaseAPI.config.modoOffline || !SupabaseAPI.isConfigurado()) {
            return JSON.parse(localStorage.getItem('emola_movimentacoes') || '[]');
        }

        try {
            const response = await fetch(`${SupabaseAPI.config.url}/rest/v1/movimentacoes?order=data.desc`, {
                method: 'GET',
                headers: SupabaseAPI.getHeaders()
            });
            if (!response.ok) throw new Error('Erro ao buscar movimentações');
            return await response.json();
        } catch (error) {
            console.warn('Erro Supabase, usando localStorage:', error);
            return JSON.parse(localStorage.getItem('emola_movimentacoes') || '[]');
        }
    },

    async criarMovimentacao(movimentacao) {
        if (SupabaseAPI.config.modoOffline || !SupabaseAPI.isConfigurado()) {
            const movimentacoes = JSON.parse(localStorage.getItem('emola_movimentacoes') || '[]');
            movimentacao.id = Formulas.gerarId();
            movimentacao.created_at = new Date().toISOString();
            movimentacoes.unshift(movimentacao);
            localStorage.setItem('emola_movimentacoes', JSON.stringify(movimentacoes));
            return movimentacao;
        }

        try {
            const response = await fetch(`${SupabaseAPI.config.url}/rest/v1/movimentacoes`, {
                method: 'POST',
                headers: SupabaseAPI.getHeaders(),
                body: JSON.stringify(movimentacao)
            });
            if (!response.ok) throw new Error('Erro ao criar movimentação');
            return await response.json();
        } catch (error) {
            console.warn('Erro Supabase, salvando local:', error);
            const movimentacoes = JSON.parse(localStorage.getItem('emola_movimentacoes') || '[]');
            movimentacao.id = Formulas.gerarId();
            movimentacao.created_at = new Date().toISOString();
            movimentacoes.unshift(movimentacao);
            localStorage.setItem('emola_movimentacoes', JSON.stringify(movimentacoes));
            return movimentacao;
        }
    },

    async deletarMovimentacao(id) {
        if (SupabaseAPI.config.modoOffline || !SupabaseAPI.isConfigurado()) {
            const movimentacoes = JSON.parse(localStorage.getItem('emola_movimentacoes') || '[]');
            const filtradas = movimentacoes.filter(m => m.id !== id);
            localStorage.setItem('emola_movimentacoes', JSON.stringify(filtradas));
            return true;
        }

        try {
            const response = await fetch(`${SupabaseAPI.config.url}/rest/v1/movimentacoes?id=eq.${id}`, {
                method: 'DELETE',
                headers: SupabaseAPI.getHeaders()
            });
            if (!response.ok) throw new Error('Erro ao deletar movimentação');
            return true;
        } catch (error) {
            console.warn('Erro Supabase, deletando local:', error);
            const movimentacoes = JSON.parse(localStorage.getItem('emola_movimentacoes') || '[]');
            const filtradas = movimentacoes.filter(m => m.id !== id);
            localStorage.setItem('emola_movimentacoes', JSON.stringify(filtradas));
            return true;
        }
    },

    // ===== CONFIGURAÇÕES =====

    salvarConfig: (url, key, moeda, estoqueMinimo) => {
        SupabaseAPI.config.url = url;
        SupabaseAPI.config.key = key;
        SupabaseAPI.config.modoOffline = false;
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
        localStorage.setItem('config_moeda', moeda);
        localStorage.setItem('config_estoque_minimo', estoqueMinimo);
        localStorage.setItem('modo_offline', 'false');
    },

    ativarModoOffline: () => {
        SupabaseAPI.config.modoOffline = true;
        localStorage.setItem('modo_offline', 'true');
    },

    carregarConfig: () => {
        return {
            url: localStorage.getItem('supabase_url') || '',
            key: localStorage.getItem('supabase_key') || '',
            moeda: localStorage.getItem('config_moeda') || 'MZN',
            estoqueMinimo: parseInt(localStorage.getItem('config_estoque_minimo')) || 10,
            modoOffline: localStorage.getItem('modo_offline') === 'true'
        };
    },

    // ===== EXPORTAÇÃO =====

    async exportarTodosDados() {
        const produtos = await SupabaseAPI.listarProdutos();
        const movimentacoes = await SupabaseAPI.listarMovimentacoes();
        return {
            estoque: produtos,
            movimentacoes: movimentacoes,
            exportado_em: new Date().toISOString(),
            versao: '1.0'
        };
    }
};

// Disponibilizar globalmente
window.SupabaseAPI = SupabaseAPI;'''

with open('/mnt/agents/output/supabase.js', 'w', encoding='utf-8') as f:
    f.write(supabase_content)

print("supabase.js criado com sucesso!")
