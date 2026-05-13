import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { routes } from './routes';

// 路由守卫：未登录跳转到 /login
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * 内层路由容器，位于 AuthProvider 内部，可访问 useAuth。
 * 当 auth 加载完成（无论已登录或未登录）后，通知 Android 原生层
 * 隐藏启动遮罩，避免 WebView 初始化过程中的闪烁。
 */
function AppContent() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // 通知 Android WebView 首屏已就绪，可以隐藏启动遮罩
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).AndroidBridge?.notifyReady();
    }
  }, [loading]);

  useEffect(() => {
    /**
     * 全局禁用浏览器/WebView 右键及长按上下文菜单。
     * Android WebView 长按会弹出系统原生菜单（文字选择/复制/链接等），
     * 该菜单叠在 Radix Dialog 遮罩上时会拦截触摸事件，导致页面卡死无法交互。
     * 直接阻止 contextmenu 默认行为可彻底解决此问题。
     */
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', blockContextMenu);
    return () => document.removeEventListener('contextmenu', blockContextMenu);
  }, []);

  return (
    <>
      <Routes>
        {/* 公开路由（登录页） */}
        {routes
          .filter((r) => r.public)
          .map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

        {/* 受保护路由（需要登录） */}
        {routes
          .filter((r) => !r.public)
          .map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RouteGuard>
                  <MainLayout>{route.element}</MainLayout>
                </RouteGuard>
              }
            />
          ))}

        {/* 404 重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
