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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
  const limit = 11;
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ApiClient | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState<ApiClient | null>(null);

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

  const openEdit = (client: ApiClient) => {
    setSelected(client);
    setEditForm({ ...client });
    setEditOpen(true);
  };

  const openDelete = (client: ApiClient) => {
    setSelected(client);
    setConfirmDelete(true);
  };

  const handleEditChange = (field: keyof ApiClient, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const submitEdit = async () => {
    if (!selected || !editForm) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/customers/${selected.code}`,
        {
          legal_name: editForm.legal_name,
          fantasy_name: editForm.fantasy_name,
          cnpj_cpf: editForm.cnpj_cpf,
          email: editForm.email,
          phone: editForm.phone,
          state: editForm.state,
          neighborhood: editForm.neighborhood,
          address: editForm.address,
          cep: editForm.cep,
          corporate_network: editForm.corporate_network,
          payment_method: editForm.payment_method,
          state_subscrition: editForm.state_subscrition,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setClients((prev) => prev.map((c) => (c.code === selected.code ? { ...c, ...editForm } : c)));
      toast?.({ description: "Cliente atualizado com sucesso!", variant: "success" });
      setEditOpen(false);
      setSelected(null);
    } catch (e: any) {
      toast?.({ description: e?.response?.data?.message || "Erro ao atualizar cliente" });
    }
  };

  const confirmDeleteAction = async () => {
    if (!selected) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/customers/${selected.code}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setClients((prev) => prev.filter((c) => c.code !== selected.code));
      toast?.({ description: "Cliente deletado com sucesso!", variant: "success" });
      setConfirmDelete(false);
      setSelected(null);
    } catch (e: any) {
      toast?.({ description: e?.response?.data?.message || "Erro ao deletar cliente" });
    }
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
      <div className="overflow-x-auto">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="text-gray-500">
              <TableHead className="w-[80px] py-1.5">Cod.</TableHead>
              <TableHead className="py-1.5">Razao social</TableHead>
              <TableHead className="py-1.5">Nome fantasia</TableHead>
              <TableHead className="py-1.5">CNPJ/CPF</TableHead>
              <TableHead className="py-1.5">Inscricao estadual</TableHead>
              <TableHead className="py-1.5">Ultima venda</TableHead>
              <TableHead className="w-[120px] text-right py-1.5">Acoes</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {clients.map((client) => {
              const isExpanded = expandedRow === client.code;

              return (
                <Fragment key={client.code}>
                  <TableRow className="text-gray-700">
                    <TableCell className="font-medium text-gray-900 py-1.5 whitespace-nowrap w-[80px]">
                      {client.code}
                    </TableCell>
                    <TableCell className="py-1.5 whitespace-normal break-words">{client.legal_name}</TableCell>
                    <TableCell className="py-1.5 whitespace-normal break-words">{client.fantasy_name}</TableCell>
                    <TableCell className="py-1.5 whitespace-normal break-words">{client.cnpj_cpf}</TableCell>
                    <TableCell className="py-1.5 whitespace-normal break-words">
                      {client.state_subscrition}
                    </TableCell>
                    <TableCell className="py-1.5 whitespace-normal break-words">
                      {formatDate(client.last_sale_date)}
                    </TableCell>
                    <TableCell className="py-1.5 whitespace-nowrap w-[120px]">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                          onClick={() => handleToggleRow(client.code)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                          onClick={() => openEdit(client)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                          onClick={() => openDelete(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableCell colSpan={7} className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3">
                          <div>
                            <h4 className="font-bold text-gray-800 text-base">
                              Endereco
                            </h4>
                            <p className="text-gray-600 text-sm break-words">
                              {client.address || "-"}
                            </p>
                            <p className="text-gray-600 text-sm break-words">
                              {client.neighborhood || "-"}
                            </p>
                            <p className="text-gray-600 text-sm break-words">
                              {client.cep} - {client.state}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-base">
                              Rede
                            </h4>
                            <p className="text-gray-600 text-sm break-words">
                              {client.corporate_network || "-"}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-base">
                              Forma de pagamento
                            </h4>
                            <p className="text-gray-600 text-sm break-words">
                              {client.payment_method || "-"}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-base">
                              Contatos
                            </h4>
                            <p className="text-gray-600 text-sm break-words">
                              {client.email || "Email nao informado"}
                            </p>
                            <p className="text-gray-600 text-sm break-words">
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
      </div>

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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl border-yellow-200">
          <DialogHeader>
            <DialogTitle className="text-yellow-800">Editar Cliente</DialogTitle>
          </DialogHeader>
          {editForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Razao social</Label>
                <Input value={editForm.legal_name} onChange={(e) => handleEditChange("legal_name", e.target.value)} />
              </div>
              <div>
                <Label>Nome fantasia</Label>
                <Input value={editForm.fantasy_name} onChange={(e) => handleEditChange("fantasy_name", e.target.value)} />
              </div>
              <div>
                <Label>CNPJ/CPF</Label>
                <Input value={editForm.cnpj_cpf} onChange={(e) => handleEditChange("cnpj_cpf", e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={editForm.email} onChange={(e) => handleEditChange("email", e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={editForm.phone} onChange={(e) => handleEditChange("phone", e.target.value)} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={editForm.state} onChange={(e) => handleEditChange("state", e.target.value)} />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={editForm.neighborhood} onChange={(e) => handleEditChange("neighborhood", e.target.value)} />
              </div>
              <div>
                <Label>Endereco</Label>
                <Input value={editForm.address} onChange={(e) => handleEditChange("address", e.target.value)} />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={editForm.cep} onChange={(e) => handleEditChange("cep", e.target.value)} />
              </div>
              <div>
                <Label>Rede</Label>
                <Input value={editForm.corporate_network} onChange={(e) => handleEditChange("corporate_network", e.target.value)} />
              </div>
              <div>
                <Label>Forma de pagamento</Label>
                <Input value={editForm.payment_method} onChange={(e) => handleEditChange("payment_method", e.target.value)} />
              </div>
              <div>
                <Label>Inscricao estadual</Label>
                <Input value={editForm.state_subscrition} onChange={(e) => handleEditChange("state_subscrition", e.target.value)} />
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={submitEdit}>Salvar</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-yellow-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja deletar este cliente?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-yellow-300 text-yellow-800 hover:bg-yellow-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={confirmDeleteAction}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminListCard>
  );
}
