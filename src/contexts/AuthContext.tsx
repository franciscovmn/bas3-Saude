import { createContext, useContext, useState } from "react";

// Tipo simplificado para o usuário mock
interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuário Falso Fixo
const MOCK_USER = {
  id: "usuario-mock-123",
  email: "admin@sistema.com",
  user_metadata: {
    full_name: "Administrador",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inicializa já com o usuário logado
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setUser(MOCK_USER);
  };

  const signUp = async () => {
    setUser(MOCK_USER);
  };

  const signOut = async () => {
    setUser(null);
    // Opcional: Se quiser que o botão sair realmente funcione, descomente a linha acima
    // Mas se quiser ignorar o login sempre, pode deixar vazio ou redirecionar.
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}