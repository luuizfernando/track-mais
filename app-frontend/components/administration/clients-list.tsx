"use client";

import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminListCard } from "./list-card";
import { TAB_CONFIG } from "./config";

interface ApiClient {
  code: number;
  legal_name: string;
  fantasy_name: string;
  cnpj_cpf: string;
  state_subscrition: string;
  email: string;
  phone: string;
  state: string;
  neighborhood: string;
  address: string;
  cep: string;
  corporate_network: string;
  payment_method: string;
  last_sale_date: string;
}

type ApiResponse = {
  data: ApiClient[];
  limit: number;
  offset: number;
  total?: number;
};

interface ClientsListProps {
  onAdd: () => void;
}

export function ClientsList({ onAdd }: ClientsListProps) {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const limit = 14;

  useEffect(() => {
    const fetchClients = async () => {
      const offset = page * limit;

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const res = await axios.get<ApiResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/customers?limit=${limit}&offset=${offset}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );

        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setClients(list);
        setExpandedRow(null);

        const total = res.data?.total;
        const computedHasNext =
          typeof total === "number"
            ? offset + list.length < total
            : list.length === limit;
        setHasNext(computedHasNext);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.response?.status === 401
            ? "Nao autorizado: verifique seu login."
            : "Erro ao carregar clientes."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [page, limit]);

  const handleToggleRow = (code: number) => {
    setExpandedRow((prev) => (prev === code ? null : code));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const onlyDate = dateString.split("T")[0];
    const [year, month, day] = onlyDate.split("-");
    if (!year || !month || !day) return "-";
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <AdminListCard meta={TAB_CONFIG.clientes} onAdd={onAdd} actionPlacement="footer">
        <div className="p-4 text-gray-500">Carregando clientes.</div>
      </AdminListCard>
    );
  }

  if (error) {
    return (
      <AdminListCard meta={TAB_CONFIG.clientes} onAdd={onAdd} actionPlacement="footer">
        <div className="p-4 text-red-600">{error}</div>
      </AdminListCard>
    );
  }

  if (clients.length === 0) {
    return (
      <AdminListCard meta={TAB_CONFIG.clientes} onAdd={onAdd} actionPlacement="footer">
        <div className="p-4 text-gray-500">Nenhum cliente encontrado.</div>
      </AdminListCard>
    );
  }

  return (
    <AdminListCard meta={TAB_CONFIG.clientes} onAdd={onAdd} actionPlacement="footer">
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="text-gray-500 text-xs">
            <TableHead className="w-[80px] py-1.5">Cod.</TableHead>
            <TableHead className="py-1.5">Razao social</TableHead>
            <TableHead className="py-1.5">Nome fantasia</TableHead>
            <TableHead className="py-1.5">CNPJ/CPF</TableHead>
            <TableHead className="py-1.5">Inscricao estadual</TableHead>
            <TableHead className="py-1.5">Ultima venda</TableHead>
            <TableHead className="w-[90px] text-right py-1.5">Acoes</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clients.map((client) => {
            const isExpanded = expandedRow === client.code;

            return (
              <Fragment key={client.code}>
                <TableRow className="text-gray-700 text-[12px] h-8">
                  <TableCell className="font-medium text-gray-900 py-1.5">
                    {client.code}
                  </TableCell>
                  <TableCell className="py-1.5">{client.legal_name}</TableCell>
                  <TableCell className="py-1.5">{client.fantasy_name}</TableCell>
                  <TableCell className="py-1.5">{client.cnpj_cpf}</TableCell>
                  <TableCell className="py-1.5">
                    {client.state_subscrition}
                  </TableCell>
                  <TableCell className="py-1.5">
                    {formatDate(client.last_sale_date)}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-gray-500 hover:text-gray-900"
                        onClick={() => handleToggleRow(client.code)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-gray-500 hover:text-gray-900"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-gray-500 hover:text-gray-900"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableCell colSpan={7} className="p-0">
                      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            Endereco
                          </h4>
                          <p className="text-gray-600 text-[12px]">
                            {client.address || "-"}
                          </p>
                          <p className="text-gray-600 text-[12px]">
                            {client.neighborhood || "-"}
                          </p>
                          <p className="text-gray-600 text-[12px]">
                            {client.cep} - {client.state}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            Rede
                          </h4>
                          <p className="text-gray-600 text-[12px]">
                            {client.corporate_network || "-"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            Forma de pagamento
                          </h4>
                          <p className="text-gray-600 text-[12px]">
                            {client.payment_method || "-"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            Contatos
                          </h4>
                          <p className="text-gray-600 text-[12px]">
                            {client.email || "Email nao informado"}
                          </p>
                          <p className="text-gray-600 text-[12px]">
                            {client.phone || "Telefone nao informado"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between p-4">
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
        >
          Anterior
        </Button>
        <span className="text-sm text-gray-600">Pagina {page + 1}</span>
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() => setPage((current) => current + 1)}
        >
          Proximo
        </Button>
      </div>
    </AdminListCard>
  );
}
