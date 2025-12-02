import { useAuth } from "@/contexts/AuthContext";
// Remova a importação do Navigate se não for usar mais
// import { Navigate } from "react-router-dom"; 

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Você pode remover o 'user' da desestruturação se não for usar
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // COMENTE OU REMOVA ESTE BLOCO DE CÓDIGO
  /* if (!user) {
    return <Navigate to="/auth" replace />;
  }
  */

  // Retorna os filhos (a página solicitada) diretamente
  return <>{children}</>;
}