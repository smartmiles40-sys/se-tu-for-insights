

## Problema Identificado

O cálculo de No-Show no Dashboard está correto na lógica, mas há uma **inconsistência de nomes** entre os campos:

- **Filtro de Vendedor** usa: `quem_vendeu` (ex: "Valéria Noronha" com acento)
- **Atribuição de No-Show** usa: `responsavel_reuniao` (ex: "Valeria Noronha" sem acento)

### Dados Encontrados

**No-Shows por `responsavel_reuniao`:**
| Responsável | Total No-Shows |
|-------------|----------------|
| Valeria Noronha | 6 |
| (vazio) | 5 |
| Talita Carvalho | 3 |

**Vendedores no filtro (`quem_vendeu`):**
- Beatriz Galvão, John Italo, Tainara Vasconcelos, Talita Carvalho, **Valéria** Noronha

### Causa Raiz
A comparação `includes()` falha porque:
- `"Valeria Noronha".includes("Valéria")` = **false** (acento diferente)

---

## Plano de Correção

### Arquivo a Modificar
`src/pages/Dashboard.tsx`

### Mudança Proposta
Adicionar normalização de acentos na comparação de nomes para garantir match correto.

```typescript
// Função auxiliar para remover acentos
const removeAccents = (str: string) => 
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// No cálculo de noShows
const noShows = negocios.filter(n => {
  if (n.data_noshow === null) return false;
  if (filters?.vendedores && filters.vendedores.length > 0) {
    const responsavel = removeAccents(n.responsavel_reuniao?.toLowerCase() || '');
    return filters.vendedores.some(v => 
      responsavel.includes(removeAccents(v.toLowerCase()))
    );
  }
  return true;
}).length;

// Aplicar mesma lógica para reunioesRealizadas
```

### Resultado Esperado
- Ao filtrar por "Valéria Noronha", os 6 no-shows atribuídos a "Valeria Noronha" serão exibidos corretamente
- Ao filtrar por "Talita Carvalho", os 3 no-shows serão exibidos

---

## Detalhes Técnicos

A função `normalize('NFD')` decompõe caracteres acentuados em caractere base + acento, e o `replace()` remove os acentos, permitindo comparação insensível a acentos:
- "Valéria" → "Valeria"
- "João" → "Joao"

