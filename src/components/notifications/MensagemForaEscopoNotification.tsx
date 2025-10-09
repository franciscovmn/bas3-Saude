import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MensagemForaEscopo {
  id: string;
  paciente_id: number;
  nutricionista_uid: string;
  mensagem: string;
  data_hora: string;
  resolvido: boolean;
  pacientes?: {
    nome: string;
    telefone: string | null;
  };
}

export function MensagemForaEscopoNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

  // Buscar mensagens não resolvidas
  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens-fora-escopo', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('mensagens_fora_do_escopo')
        .select(`
          *,
          pacientes (
            nome,
            telefone
          )
        `)
        .eq('nutricionista_uid', user.id)
        .eq('resolvido', false)
        .order('data_hora', { ascending: false });

      if (error) throw error;
      return data as MensagemForaEscopo[];
    },
    enabled: !!user?.id,
  });

  // Configurar listener em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('mensagens-fora-escopo-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_fora_do_escopo',
          filter: `nutricionista_uid=eq.${user.id}`,
        },
        (payload) => {
          console.log('Nova mensagem fora do escopo:', payload);
          
          // Invalidar query para buscar dados atualizados
          queryClient.invalidateQueries({ queryKey: ['mensagens-fora-escopo'] });
          
          // Mostrar toast de notificação
          toast.info('Nova mensagem de paciente', {
            description: 'Um paciente enviou uma mensagem fora do escopo da IA',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens_fora_do_escopo',
          filter: `nutricionista_uid=eq.${user.id}`,
        },
        () => {
          // Atualizar lista quando uma mensagem for marcada como resolvida
          queryClient.invalidateQueries({ queryKey: ['mensagens-fora-escopo'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleAssumirAtendimento = async (mensagem: MensagemForaEscopo) => {
    if (!mensagem.pacientes?.telefone) {
      toast.error('Telefone do paciente não encontrado');
      return;
    }

    // Marcar mensagem como resolvida
    const { error } = await supabase
      .from('mensagens_fora_do_escopo')
      .update({ resolvido: true })
      .eq('id', mensagem.id);

    if (error) {
      toast.error('Erro ao marcar mensagem como resolvida');
      console.error(error);
      return;
    }

    // Limpar telefone (remover caracteres especiais)
    const telefone = mensagem.pacientes.telefone.replace(/\D/g, '');
    
    // Criar mensagem inicial
    const mensagemInicial = `Olá ${mensagem.pacientes.nome}, Bruno Belota aqui, estou assumindo o atendimento`;
    
    // Abrir WhatsApp Web em nova aba
    const whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagemInicial)}`;
    window.open(whatsappUrl, '_blank');

    toast.success('Atendimento assumido com sucesso');
  };

  const handleMarcarComoResolvido = async (mensagemId: string) => {
    const { error } = await supabase
      .from('mensagens_fora_do_escopo')
      .update({ resolvido: true })
      .eq('id', mensagemId);

    if (error) {
      toast.error('Erro ao marcar mensagem como resolvida');
      console.error(error);
      return;
    }

    toast.success('Mensagem marcada como resolvida');
  };

  if (!mensagens.length) return null;

  return (
    <>
      {/* Botão de notificação */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {mensagens.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {mensagens.length}
            </span>
          )}
        </Button>
      </div>

      {/* Painel de notificações */}
      {showNotifications && (
        <div className="fixed top-16 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
          <Card className="p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Mensagens de Pacientes</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {mensagens.map((mensagem) => (
                <Card key={mensagem.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {mensagem.pacientes?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(mensagem.data_hora).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm line-clamp-3">{mensagem.mensagem}</p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAssumirAtendimento(mensagem)}
                        className="flex-1"
                      >
                        Assumir atendimento
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarcarComoResolvido(mensagem.id)}
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
