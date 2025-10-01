import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingDown, Wallet, TrendingUp, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { NovaTransacaoModal } from "@/components/modals/NovaTransacaoModal";

export default function Financeiro() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [modalReceitaOpen, setModalReceitaOpen] = useState(false);
  const [modalDespesaOpen, setModalDespesaOpen] = useState(false);

  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
  const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

  const { data: transactions } = useQuery({
    queryKey: ["transactions", selectedMonth, selectedYear, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fluxo_de_caixa")
        .select("*")
        .eq("user_id", user?.id)
        .gte("data", firstDayOfMonth.toISOString())
        .lte("data", lastDayOfMonth.toISOString())
        .order("data", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const receitas = transactions?.filter(t => t.tipo_transacao === "receita").reduce((sum, t) => sum + Number(t.valor || 0), 0) || 0;
  const despesas = transactions?.filter(t => t.tipo_transacao === "despesa").reduce((sum, t) => sum + Number(t.valor || 0), 0) || 0;
  const saldoLiquido = receitas - despesas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle completo das finanças do consultório
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalReceitaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Receita
          </Button>
          <Button variant="outline" onClick={() => setModalDespesaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Despesa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Caixa Realizado"
          value={formatCurrency(receitas)}
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Despesas"
          value={formatCurrency(despesas)}
          icon={TrendingDown}
          variant="destructive"
        />
        <KPICard
          title="Saldo Líquido"
          value={formatCurrency(saldoLiquido)}
          icon={Wallet}
          variant={saldoLiquido >= 0 ? "default" : "destructive"}
        />
        <KPICard
          title="Faturamento"
          value={formatCurrency(receitas)}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.data || ""), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{transaction.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.categoria}</Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.tipo_transacao === "receita"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {transaction.tipo_transacao === "receita" ? "+" : "-"}
                      {formatCurrency(Number(transaction.valor))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação registrada neste período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NovaTransacaoModal open={modalReceitaOpen} onOpenChange={setModalReceitaOpen} tipo="receita" />
      <NovaTransacaoModal open={modalDespesaOpen} onOpenChange={setModalDespesaOpen} tipo="despesa" />
    </div>
  );
}
