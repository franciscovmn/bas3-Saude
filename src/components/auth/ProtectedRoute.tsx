import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se por algum motivo o usuário for null (ex: clicou em sair), vai pro login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}