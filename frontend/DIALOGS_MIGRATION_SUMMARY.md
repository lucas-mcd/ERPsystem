# Migração de Alertas do Navegador para Diálogos Customizados

## Resumo das Mudanças

Todas as alertas de navegador (`alert()` e `confirm()`) foram removidas e substituídas por um sistema de diálogos customizados que segue o padrão estético do site.

### Arquivos Criados

1. **`src/context/ConfirmDialogContext.tsx`**
   - Provider global para gerenciar diálogos de confirmação e alertas
   - Sistema de Promise para sincronização de ações
   - Suporta confirmações (sim/não) e alertas (apenas OK)

2. **`src/hooks/useConfirmDialog.ts`**
   - Hook `useConfirmDialog()` - acesso direto ao contexto
   - Hook `useConfirm()` - função auxiliar para confirmações
   - Hook `useAlert()` - objeto com métodos `info()`, `success()`, `warning()`, `error()`

### Componentes Utilizados

- **`ConfirmDialog`** - Modal de confirmação reutilizável (já existia em `src/components/ui/Modal.tsx`)
- Suporta títulos, mensagens, botões customizáveis e modo "perigoso" (vermelho)

### Páginas Atualizadas

1. **HRManagementPage.tsx**
   - ✅ Alert de campos obrigatórios → `alert.warning()`
   - ✅ Confirm de deletar funcionário → `showConfirm()`

2. **UsersPage.tsx**
   - ✅ Confirm de deletar usuário → `showConfirm()`

3. **FinancialManagementPage.tsx**
   - ✅ Confirms de deletar contas, receivables, payables, cash flows → `showConfirm()`

4. **ClientsPage.tsx**
   - ✅ Confirm de deletar cliente → `showConfirm()`

5. **OrdersManagementPage.tsx**
   - ✅ Alerts de validação → `alert.warning()`
   - ✅ Alerts de sucesso → `alert.success()`
   - ✅ Alerts de erro → `alert.error()`
   - ✅ Confirm de deletar pedido → `showConfirm()`

6. **SupplierManagementPage.tsx**
   - ✅ Alerts de campos obrigatórios → `alert.warning()`
   - ✅ Alerts de sucesso → `alert.success()`
   - ✅ Alerts de erro → `alert.error()`
   - ✅ Confirm de deletar fornecedor → `showConfirm()`

7. **ProductsPage.tsx**
   - ✅ Confirm de deletar produto → `showConfirm()`

8. **AuditLogsPage.tsx**
   - ✅ Alert de sucesso (logs removidos) → `alert.success()`

9. **StockManagementPage.tsx**
   - ✅ Alerts de campo obrigatório → `alert.warning()`
   - ✅ Alerts de sucesso → `alert.success()`
   - ✅ Alerts de erro → `alert.error()`

10. **UserSettingsPage.tsx**
    - ✅ Alerts de validação de senha → `alert.warning()`
    - ✅ Alert de sucesso de mudança de senha → `alert.success()`

11. **AdvancedReportsPage.tsx**
    - ✅ Alert de não autenticado → `alert.error()`
    - ✅ Alert de erro de download → `alert.error()`

### Integração com App.tsx

O `ConfirmDialogProvider` foi adicionado como wrapper no componente raiz:

```tsx
<ThemeProvider>
  <Router>
    <AuthProvider>
      <ConfirmDialogProvider>
        <AppContent />
      </ConfirmDialogProvider>
    </AuthProvider>
  </Router>
</ThemeProvider>
```

## Uso

### Para Confirmação (Sim/Não)

```tsx
const { showConfirm } = useConfirmDialog()

const confirmed = await showConfirm({
  title: 'Confirmar Ação',
  message: 'Tem certeza que deseja continuar?',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  isDangerous: false, // ou true para deixar em vermelho
})

if (confirmed) {
  // Ação confirmada
}
```

### Para Alertas

```tsx
const alert = useAlert()

// Tipos disponíveis:
await alert.info('Título', 'Mensagem informativa')
await alert.success('Título', 'Mensagem de sucesso')
await alert.warning('Título', 'Mensagem de aviso')
await alert.error('Título', 'Mensagem de erro')
```

## Benefícios

✅ **UX Melhorada** - Diálogos customizados seguem padrão visual do site
✅ **Sem Travamento** - Não trava a página como os alertas do navegador
✅ **Acessibilidade** - Melhor suporte a teclado e leitores de tela
✅ **Consistência** - Visual uniforme em todas as páginas
✅ **Reutilizável** - Sistema centralizado e fácil de expandir
✅ **Type-Safe** - Full TypeScript support

## Próximas Melhorias (Opcional)

- [ ] Adicionar animações de entrada/saída
- [ ] Suportar múltiplos diálogos simultâneos
- [ ] Adicionar ações customizadas no rodapé
- [ ] Persistir preferências do usuário para diálogos
