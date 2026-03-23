import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { User, Lock, Shield, Bell, Palette, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout2';
import { Button, Badge, StatCard } from '@/components/ui/common';
import { FormInput } from '@/components/forms/FormFields';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { TwoFASetupModal } from '@/components/TwoFA/TwoFAModals';
import { twoFAManager, } from '@/lib/twoFAManager';
import { activityLogger } from '@/lib/activityLogger';
export function UserSettingsPage() {
    const { user, logout } = useAuth();
    const { theme, themeMode, setTheme, resetToSystemTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    // Two FA States
    const [showTwoFASetup, setShowTwoFASetup] = useState(false);
    const [showTwoFADisable, setShowTwoFADisable] = useState(false);
    const [twoFAEnabled, setTwoFAEnabled] = useState(user?.two_fa_enabled || false);
    const [remainingBackupCodes, setRemainingBackupCodes] = useState(user?.two_fa_backup_codes_remaining || 0);
    const [twoFASession, setTwoFASession] = useState(null);
    // Password Change
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const handleEnableTwoFA = (secret, backupCodes) => {
        // Create session
        const session = twoFAManager.createSession(user?.id.toString() || 'user');
        session.backupCodes = backupCodes;
        session.secret = secret;
        setTwoFASession(session);
        // In a real app, save to backend
        setTwoFAEnabled(true);
        setRemainingBackupCodes(backupCodes.length);
        // Log the event
        activityLogger.log(user?.id.toString() || 'user', user?.full_name || 'User', user?.email || 'user@example.com', '2FA_ENABLE', 'USER', {
            status: 'success',
            details: {
                backupCodesCount: backupCodes.length,
            },
        });
        setShowTwoFASetup(false);
    };
    const handleDisableTwoFA = () => {
        // In a real app, call API to disable 2FA
        const session = twoFAManager.getSession(user?.id.toString() || 'user');
        if (session) {
            twoFAManager.disable(user?.id.toString() || 'user');
        }
        setTwoFAEnabled(false);
        setRemainingBackupCodes(0);
        setTwoFASession(null);
        setShowTwoFADisable(false);
        // Log the event
        activityLogger.log(user?.id.toString() || 'user', user?.full_name || 'User', user?.email || 'user@example.com', '2FA_DISABLE', 'USER', { status: 'success' });
    };
    const handleChangePassword = () => {
        if (!passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.confirmPassword) {
            alert('Preencha todos os campos');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('As senhas não correspondem');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            alert('A nova senha deve ter pelo menos 8 caracteres');
            return;
        }
        // In a real app, call API to change password
        activityLogger.log(user?.id.toString() || 'user', user?.full_name || 'User', user?.email || 'user@example.com', 'PASSWORD_CHANGE', 'USER', { status: 'success' });
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setShowPasswordChange(false);
        alert('Senha alterada com sucesso!');
    };
    if (!user) {
        return (_jsx(MainLayout, { title: "Configura\u00E7\u00F5es", children: _jsx("div", { className: "text-center py-12", children: _jsx("p", { children: "Carregando..." }) }) }));
    }
    return (_jsxs(MainLayout, { title: "Configura\u00E7\u00F5es da Conta", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx(StatCard, { title: "Autentica\u00E7\u00E3o de Dois Fatores", value: twoFAEnabled ? 'Ativado' : 'Desativado', variant: twoFAEnabled ? 'green' : 'amber', icon: Shield }), _jsx(StatCard, { title: "Status da Conta", value: user.is_active ? 'Ativa' : 'Inativa', variant: user.is_active ? 'green' : 'red' }), twoFAEnabled && (_jsx(StatCard, { title: "C\u00F3digos de Backup Restantes", value: remainingBackupCodes, variant: remainingBackupCodes > 5 ? 'green' : 'amber' }))] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mb-6", children: [_jsxs("div", { className: "flex border-b border-gray-200 dark:border-slate-700", children: [_jsxs("button", { onClick: () => setActiveTab('profile'), className: `flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'profile'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`, children: [_jsx(User, { className: "w-5 h-5 inline mr-2" }), "Perfil"] }), _jsxs("button", { onClick: () => setActiveTab('security'), className: `flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'security'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`, children: [_jsx(Lock, { className: "w-5 h-5 inline mr-2" }), "Seguran\u00E7a"] }), _jsxs("button", { onClick: () => setActiveTab('notifications'), className: `flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'notifications'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`, children: [_jsx(Bell, { className: "w-5 h-5 inline mr-2" }), "Notifica\u00E7\u00F5es"] }), _jsxs("button", { onClick: () => setActiveTab('preferences'), className: `flex-1 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'preferences'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`, children: [_jsx(Palette, { className: "w-5 h-5 inline mr-2" }), "Prefer\u00EAncias"] })] }), _jsxs("div", { className: "p-6", children: [activeTab === 'profile' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Nome Completo" }), _jsx("p", { className: "text-gray-700 dark:text-slate-300", children: user.full_name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Email" }), _jsx("p", { className: "text-gray-700 dark:text-slate-300", children: user.email })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Fun\u00E7\u00E3o" }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Badge, { variant: user.role === 'admin'
                                                        ? 'red'
                                                        : user.role === 'user'
                                                            ? 'blue'
                                                            : 'gray', children: user.role === 'admin'
                                                        ? 'Administrador'
                                                        : user.role === 'user'
                                                            ? 'Usuário'
                                                            : 'Visualizador' }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Status" }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Badge, { variant: user.is_active ? 'green' : 'red', children: user.is_active ? 'Ativo' : 'Inativo' }) })] })] })), activeTab === 'security' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-blue-900 dark:text-blue-300 mb-2", children: "Seguran\u00E7a da Conta" }), _jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200", children: "Mantenha sua conta segura com autentica\u00E7\u00E3o de dois fatores e altera\u00E7\u00F5es de senha regulares." })] }), _jsxs("div", { className: "border-t border-gray-200 dark:border-slate-700 pt-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Alterar Senha" }), _jsx(Button, { variant: "secondary", onClick: () => setShowPasswordChange(true), children: "Alterar Senha" })] }), _jsxs("div", { className: "border-t border-gray-200 dark:border-slate-700 pt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white", children: "Autentica\u00E7\u00E3o de Dois Fatores" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-400 mt-1", children: twoFAEnabled
                                                                    ? 'Sua conta está protegida com 2FA'
                                                                    : 'Ative 2FA para maior segurança' })] }), _jsx(Badge, { variant: twoFAEnabled ? 'green' : 'amber', children: twoFAEnabled ? 'Ativado' : 'Desativado' })] }), twoFAEnabled ? (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-sm text-gray-600 dark:text-slate-400", children: _jsxs("p", { children: ["C\u00F3digos de backup dispon\u00EDveis:", ' ', _jsx("span", { className: "font-semibold", children: remainingBackupCodes })] }) }), _jsx(Button, { variant: "danger", size: "sm", onClick: () => setShowTwoFADisable(true), children: "Desativar 2FA" })] })) : (_jsx(Button, { variant: "primary", size: "sm", onClick: () => setShowTwoFASetup(true), children: "Ativar 2FA" }))] })] })), activeTab === 'notifications' && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "w-4 h-4" }), _jsx("span", { className: "text-gray-900 dark:text-white", children: "Notifica\u00E7\u00F5es de Login" })] }), _jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "w-4 h-4" }), _jsx("span", { className: "text-gray-900 dark:text-white", children: "Alertas de Seguran\u00E7a" })] }), _jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "w-4 h-4" }), _jsx("span", { className: "text-gray-900 dark:text-white", children: "Atualiza\u00E7\u00F5es da Conta" })] })] }) })), activeTab === 'preferences' && (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-1", children: "Tema da Interface" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-400 mb-4", children: "Escolha como voc\u00EA prefere visualizar a aplica\u00E7\u00E3o" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsxs("button", { onClick: () => {
                                                            setTheme('system');
                                                            activityLogger.log(user?.id.toString() || 'user', user?.full_name || 'User', user?.email || 'user@example.com', 'SETTINGS_CHANGE', 'USER', {
                                                                status: 'success',
                                                                details: { setting: 'theme', value: 'system' },
                                                            });
                                                        }, className: `relative p-6 rounded-lg border-2 transition-all ${themeMode === 'system'
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`, children: [_jsx(Monitor, { className: "w-6 h-6 mb-2 text-gray-700 dark:text-slate-300" }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white text-sm", children: "Autom\u00E1tico" }), _jsx("p", { className: "text-xs text-gray-600 dark:text-slate-400 mt-1", children: "Segue a prefer\u00EAncia do SO" }), themeMode === 'system' && (_jsx("div", { className: "absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full" }))] }), _jsxs("button", { onClick: () => {
                                                            setTheme('light');
                                                            activityLogger.log(user?.id.toString() || 'user', user?.full_name || 'User', user?.email || 'user@example.com', 'SETTINGS_CHANGE', 'USER', {
                                                                status: 'success',
                                                                details: { setting: 'theme', value: 'light' },
                                                            });
                                                        }, className: `relative p-6 rounded-lg border-2 transition-all ${themeMode === 'light'
                                                            ? 'border-yellow-500 bg-yellow-50'
                                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`, children: [_jsx(Sun, { className: "w-6 h-6 mb-2 text-yellow-500" }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white text-sm", children: "Claro" }), _jsx("p", { className: "text-xs text-gray-600 dark:text-slate-400 mt-1", children: "Branco e cores claras" }), themeMode === 'light' && (_jsx("div", { className: "absolute top-2 right-2 w-4 h-4 bg-yellow-500 rounded-full" }))] }), _jsxs("button", { onClick: () => {
                                                            setTheme('dark');
                                                            activityLogger.log(user?.id.toString() || 'user', user?.full_name || 'User', user?.email || 'user@example.com', 'SETTINGS_CHANGE', 'USER', {
                                                                status: 'success',
                                                                details: { setting: 'theme', value: 'dark' },
                                                            });
                                                        }, className: `relative p-6 rounded-lg border-2 transition-all ${themeMode === 'dark'
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`, children: [_jsx(Moon, { className: "w-6 h-6 mb-2 text-indigo-600 dark:text-indigo-400" }), _jsx("p", { className: "font-medium text-gray-900 dark:text-white text-sm", children: "Escuro" }), _jsx("p", { className: "text-xs text-gray-600 dark:text-slate-400 mt-1", children: "Preto e tons escuros" }), themeMode === 'dark' && (_jsx("div", { className: "absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full" }))] })] }), themeMode === 'system' && (_jsx("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3", children: _jsxs("p", { className: "text-sm text-blue-800 dark:text-blue-300", children: ["\uD83D\uDCA1 Tema atual: ", _jsx("span", { className: "font-semibold capitalize", children: theme })] }) }))] }), _jsxs("div", { className: "border-t border-gray-200 dark:border-slate-700 pt-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Prefer\u00EAncias Gerais" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Idioma" }), _jsxs("select", { className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white", children: [_jsx("option", { children: "Portugu\u00EAs (Brasil)" }), _jsx("option", { children: "English" }), _jsx("option", { children: "Espa\u00F1ol" })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-900 dark:text-white mb-2", children: "Formato de Data" }), _jsxs("select", { className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white", children: [_jsx("option", { children: "DD/MM/YYYY" }), _jsx("option", { children: "MM/DD/YYYY" }), _jsx("option", { children: "YYYY-MM-DD" })] })] })] })] }))] })] }), _jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6", children: [_jsx("h3", { className: "font-bold text-red-900 dark:text-red-300 mb-4", children: "Zona de Perigo" }), _jsx(Button, { variant: "danger", icon: LogOut, onClick: () => setShowLogoutConfirm(true), children: "Sair da Conta" })] }), _jsx(TwoFASetupModal, { isOpen: showTwoFASetup, onClose: () => setShowTwoFASetup(false), onEnable: handleEnableTwoFA, userId: user.email }), _jsx(ConfirmDialog, { isOpen: showTwoFADisable, title: "Desativar 2FA", message: "Tem certeza que deseja desativar a autentica\u00E7\u00E3o de dois fatores? Sua conta ficar\u00E1 menos segura.", onConfirm: handleDisableTwoFA, onCancel: () => setShowTwoFADisable(false) }), _jsx(Modal, { isOpen: showPasswordChange, onClose: () => {
                    setShowPasswordChange(false);
                    setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                    });
                }, title: "Alterar Senha", size: "sm", children: _jsxs("div", { className: "space-y-4", children: [_jsx(FormInput, { label: "Senha Atual", type: "password", value: passwordForm.currentPassword, onChange: (e) => setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                            }), placeholder: "Digite sua senha atual" }), _jsx(FormInput, { label: "Nova Senha", type: "password", value: passwordForm.newPassword, onChange: (e) => setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                            }), placeholder: "Digite a nova senha" }), _jsx(FormInput, { label: "Confirmar Senha", type: "password", value: passwordForm.confirmPassword, onChange: (e) => setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                            }), placeholder: "Confirme a nova senha" }), _jsxs("div", { className: "flex gap-3 justify-end pt-4", children: [_jsx(Button, { variant: "ghost", onClick: () => {
                                        setShowPasswordChange(false);
                                        setPasswordForm({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: '',
                                        });
                                    }, children: "Cancelar" }), _jsx(Button, { variant: "primary", onClick: handleChangePassword, children: "Alterar Senha" })] })] }) }), _jsx(ConfirmDialog, { isOpen: showLogoutConfirm, title: "Sair da Conta", message: "Tem certeza que deseja sair? Voc\u00EA ser\u00E1 redirecionado para a p\u00E1gina de login.", onConfirm: () => {
                    setShowLogoutConfirm(false);
                    logout();
                }, onCancel: () => setShowLogoutConfirm(false) })] }));
}
