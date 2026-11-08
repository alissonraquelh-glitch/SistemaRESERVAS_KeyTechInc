import React, { createContext, useContext, useState, useCallback } from 'react';
import { ROLES, canAccessView } from '../adapters/authAdapter';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null); // { email, role, name }
  const [activeInternalView, setActiveInternalView] = useState(ROLES.SECRETARIA);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Intentar login
  const login = useCallback(
    async (email, password) => {
      // Validación básica de entrada
      if (!email || !email.includes('@')) {
        showToast("Formato de correo inválido.", "error");
        return false;
      }
      if (!password || password.length < 4) {
        showToast("La contraseña debe tener mínimo 4 caracteres.", "error");
        return false;
      }

      const cleanEmail = email.trim().toLowerCase();

      // NOTA DE SEGURIDAD / INTEGRACIÓN:
      // Sin endpoint real en backend, se provee soporte controlado para pruebas locales de roles
      // sin quemar contraseñas como verdad del sistema de producción.
      let detectedRole = ROLES.SECRETARIA;
      let userName = 'Personal Taller Bautista';

      if (cleanEmail.includes('admin') || cleanEmail.includes('josue')) {
        detectedRole = ROLES.ADMIN;
        userName = 'Administrador General';
      } else if (cleanEmail.includes('jefe') || cleanEmail.includes('nacho')) {
        detectedRole = ROLES.JEFE;
        userName = 'Jefe de Taller';
      } else {
        detectedRole = ROLES.SECRETARIA;
        userName = 'Secretaría de Recepción';
      }

      setCurrentUser({
        email: cleanEmail,
        role: detectedRole,
        name: userName,
      });

      // Vista inicial según el rol asignado
      if (detectedRole === ROLES.JEFE) {
        setActiveInternalView(ROLES.JEFE);
      } else if (detectedRole === ROLES.ADMIN) {
        setActiveInternalView(ROLES.ADMIN);
      } else {
        setActiveInternalView(ROLES.SECRETARIA);
      }

      setIsLoginModalOpen(false);
      showToast(`Autenticación exitosa como [${detectedRole.toUpperCase()}]. Bienvenido.`, "success");
      return true;
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveInternalView(ROLES.SECRETARIA);
    showToast("Sesión cerrada correctamente.", "info");
  }, [showToast]);

  const switchInternalView = useCallback(
    (targetView) => {
      if (!currentUser) return;
      if (!canAccessView(currentUser.role, targetView)) {
        showToast("Acceso denegado: Tu rol solo permite visualizar tu panel asignado.", "error");
        return;
      }
      setActiveInternalView(targetView);
    },
    [currentUser, showToast]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        activeInternalView,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        switchInternalView,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
