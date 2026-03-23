/**
 * Configuração i18next para internacionalização
 * Suporta português, inglês e espanhol
 */

export const translations = {
  pt: {
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      delete: 'Deletar',
      edit: 'Editar',
      create: 'Criar',
      save: 'Salvar',
      cancel: 'Cancelar',
      close: 'Fechar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      actions: 'Ações',
      yes: 'Sim',
      no: 'Não',
      confirm: 'Confirmar',
      goBack: 'Voltar',
      home: 'Início',
      welcome: 'Bem-vindo',
      logout: 'Sair',
      settings: 'Configurações',
      language: 'Idioma',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Escuro',
      system: 'Sistema',
    },
    navigation: {
      dashboard: 'Dashboard',
      users: 'Usuários',
      clients: 'Clientes',
      products: 'Produtos',
      orders: 'Pedidos',
      reports: 'Relatórios',
      settings: 'Configurações',
      auditLogs: 'Auditoria',
    },
    auth: {
      login: 'Entrar',
      logout: 'Sair',
      email: 'Email',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha',
      forgotPassword: 'Esqueceu a senha?',
      rememberMe: 'Lembrar-me',
      signUp: 'Cadastrar',
      invalidCredentials: 'Email ou senha inválidos',
      passwordMismatch: 'As senhas não correspondem',
      twoFA: 'Autenticação de Dois Fatores',
      enterCode: 'Digite o código',
      backupCodeBrowser: 'Usar código de backup',
    },
    validation: {
      required: 'Campo obrigatório',
      invalidEmail: 'Email inválido',
      minLength: 'Mínimo de {min} caracteres',
      maxLength: 'Máximo de {max} caracteres',
      passwordTooWeak: 'Senha muito fraca',
      dateInvalid: 'Data inválida',
      numberInvalid: 'Número inválido',
    },
    messages: {
      createdSuccessfully: '{resource} criado com sucesso',
      updatedSuccessfully: '{resource} atualizado com sucesso',
      deletedSuccessfully: '{resource} deletado com sucesso',
      confirmDelete: 'Tem certeza que deseja deletar este {resource}?',
      offline: 'Você está offline. Algumas funcionalidades podem estar limitadas.',
      online: 'Conexão restaurada',
      updateAvailable: 'Uma nova versão está disponível',
      noResults: 'Nenhum resultado encontrado',
      loadingFailed: 'Falha ao carregar dados',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      actions: 'Actions',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      goBack: 'Go Back',
      home: 'Home',
      welcome: 'Welcome',
      logout: 'Logout',
      settings: 'Settings',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    navigation: {
      dashboard: 'Dashboard',
      users: 'Users',
      clients: 'Clients',
      products: 'Products',
      orders: 'Orders',
      reports: 'Reports',
      settings: 'Settings',
      auditLogs: 'Audit Logs',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember me',
      signUp: 'Sign Up',
      invalidCredentials: 'Invalid email or password',
      passwordMismatch: 'Passwords do not match',
      twoFA: 'Two-Factor Authentication',
      enterCode: 'Enter code',
      backupCodeBrowser: 'Use backup code',
    },
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email',
      minLength: 'Minimum {min} characters',
      maxLength: 'Maximum {max} characters',
      passwordTooWeak: 'Password is too weak',
      dateInvalid: 'Invalid date',
      numberInvalid: 'Invalid number',
    },
    messages: {
      createdSuccessfully: '{resource} created successfully',
      updatedSuccessfully: '{resource} updated successfully',
      deletedSuccessfully: '{resource} deleted successfully',
      confirmDelete: 'Are you sure you want to delete this {resource}?',
      offline: 'You are offline. Some features may be limited.',
      online: 'Connection restored',
      updateAvailable: 'A new version is available',
      noResults: 'No results found',
      loadingFailed: 'Failed to load data',
    },
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      save: 'Guardar',
      cancel: 'Cancelar',
      close: 'Cerrar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      actions: 'Acciones',
      yes: 'Sí',
      no: 'No',
      confirm: 'Confirmar',
      goBack: 'Volver',
      home: 'Inicio',
      welcome: 'Bienvenido',
      logout: 'Cerrar sesión',
      settings: 'Configuración',
      language: 'Idioma',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
    },
    navigation: {
      dashboard: 'Panel de control',
      users: 'Usuarios',
      clients: 'Clientes',
      products: 'Productos',
      orders: 'Pedidos',
      reports: 'Informes',
      settings: 'Configuración',
      auditLogs: 'Registro de auditoría',
    },
    auth: {
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      forgotPassword: '¿Olvidó la contraseña?',
      rememberMe: 'Recuérdeme',
      signUp: 'Registrarse',
      invalidCredentials: 'Correo o contraseña inválidos',
      passwordMismatch: 'Las contraseñas no coinciden',
      twoFA: 'Autenticación de dos factores',
      enterCode: 'Ingrese código',
      backupCodeBrowser: 'Usar código de respaldo',
    },
    validation: {
      required: 'Este campo es obligatorio',
      invalidEmail: 'Correo electrónico inválido',
      minLength: 'Mínimo {min} caracteres',
      maxLength: 'Máximo {max} caracteres',
      passwordTooWeak: 'La contraseña es demasiado débil',
      dateInvalid: 'Fecha inválida',
      numberInvalid: 'Número inválido',
    },
    messages: {
      createdSuccessfully: '{resource} creado exitosamente',
      updatedSuccessfully: '{resource} actualizado exitosamente',
      deletedSuccessfully: '{resource} eliminado exitosamente',
      confirmDelete: '¿Está seguro de que desea eliminar este {resource}?',
      offline: 'Estás sin conexión. Algunas funciones pueden ser limitadas.',
      online: 'Conexión restaurada',
      updateAvailable: 'Una nueva versión está disponible',
      noResults: 'No se encontraron resultados',
      loadingFailed: 'No se pudieron cargar los datos',
    },
  },
}

/**
 * Tipo para keys de tradução
 */
export type TranslationKey = 
  | `common.${keyof typeof translations.pt.common}`
  | `navigation.${keyof typeof translations.pt.navigation}`
  | `auth.${keyof typeof translations.pt.auth}`
  | `validation.${keyof typeof translations.pt.validation}`
  | `messages.${keyof typeof translations.pt.messages}`

/**
 * Tipo para idiomas suportados
 */
export type Language = keyof typeof translations

/**
 * Obtém tradução aninhada por chave (ex: 'common.loading')
 */
export function getTranslation(
  key: string,
  language: Language = 'pt'
): string {
  const parts = key.split('.')
  let current: any = translations[language]

  for (const part of parts) {
    current = current?.[part]
    if (!current) return key // Retorna chave se não encontrar
  }

  return current
}

/**
 * Substitui placeholders em string
 * Ex: "Olá {name}" com { name: "João" }
 */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/{(\w+)}/g, (match, key) => values[key] || match)
}

/**
 * Obtém tradução com interpolação
 */
export function t(
  key: string,
  values?: Record<string, string>,
  language: Language = (localStorage.getItem('language') as Language) || 'pt'
): string {
  const translation = getTranslation(key, language)
  return values ? interpolate(translation, values) : translation
}
