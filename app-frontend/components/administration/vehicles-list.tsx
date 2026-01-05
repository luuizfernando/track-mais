"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2 } from "lucide-react";
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

interface ApiVehicle {
  id: number;
  model: string;
  plate: string;
  phone: string;
  maximumLoad: number | null;
  description: string | null;
}

type ApiResponse = {
  data: ApiVehicle[];
  limit: number;
  offset: number;
  total?: number;
};

interface VehiclesListProps {
  onAdd: () => void;
}

export function VehiclesList({ onAdd }: VehiclesListProps) {
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const limit = 13;
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ApiVehicle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState<ApiVehicle | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      const offset = page * limit;

      try {
        setError(null);
        setLoading(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get<ApiResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/vehicles?limit=${limit}&offset=${offset}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );

        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setVehicles(list);

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
            ? "Nao autorizado: verifique seu login/token."
            : "Erro ao carregar veiculos."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [page, limit]);

  if (loading) {
    return (
      <AdminListCard
        meta={TAB_CONFIG.veiculos}
        onAdd={onAdd}
        actionPlacement="footer"
      >
        <div className="p-4 text-gray-500">Carregando veiculos.</div>
      </AdminListCard>
    );
  }

  if (error) {
    return (
      <AdminListCard
        meta={TAB_CONFIG.veiculos}
        onAdd={onAdd}
        actionPlacement="footer"
      >
        <div className="p-4 text-red-600">{error}</div>
      </AdminListCard>
    );
  }

  if (vehicles.length === 0) {
    return (
      <AdminListCard
        meta={TAB_CONFIG.veiculos}
        onAdd={onAdd}
        actionPlacement="footer"
      >
        <div className="p-4 text-gray-500">Nenhum veiculo cadastrado.</div>
      </AdminListCard>
    );
  }

  return (
    <AdminListCard
      meta={TAB_CONFIG.veiculos}
      onAdd={onAdd}
      actionPlacement="footer"
    >
      <Table>
        <TableHeader>
          <TableRow className="text-gray-500">
            <TableHead className="w-[90px]">Cod.</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Carga Max.</TableHead>
            <TableHead>Observacoes</TableHead>
            <TableHead className="text-end">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id} className="text-gray-700">
              <TableCell className="font-medium text-gray-900">
                {vehicle.id}
              </TableCell>
              <TableCell className="font-medium ">{vehicle.model}</TableCell>
              <TableCell>{vehicle.plate}</TableCell>
              <TableCell>{vehicle.phone}</TableCell>
              <TableCell>{vehicle.maximumLoad ?? "-"}</TableCell>
              <TableCell>{vehicle.description ?? "-"}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                    onClick={() => { setSelected(vehicle); setEditForm({ ...vehicle }); setEditOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                    onClick={() => { setSelected(vehicle); setConfirmDelete(true); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl border-yellow-200">
          <DialogHeader>
            <DialogTitle className="text-yellow-800">Editar Veiculo</DialogTitle>
          </DialogHeader>
          {editForm ? (
            <div className="space-y-3">
              <div>
                <Label>Modelo</Label>
                <Input value={editForm.model} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, model: e.target.value } : prev))} />
              </div>
              <div>
                <Label>Placa</Label>
                <Input value={editForm.plate} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, plate: e.target.value } : prev))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, phone: e.target.value } : prev))} />
              </div>
              <div>
                <Label>Carga Max.</Label>
                <Input value={String(editForm.maximumLoad ?? "")} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, maximumLoad: Number(e.target.value) || null } : prev))} />
              </div>
              <div>
                <Label>Observacoes</Label>
                <Input value={editForm.description ?? ""} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!selected || !editForm) return;
                  try {
                    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                    await axios.patch(
                      `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${selected.id}`,
                      {
                        model: editForm.model,
                        plate: editForm.plate,
                        phone: editForm.phone,
                        maximumLoad: editForm.maximumLoad,
                        description: editForm.description,
                      },
                      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
                    );
                    setVehicles((prev) => prev.map((v) => (v.id === selected.id ? { ...v, ...editForm } : v)));
                    toast?.({ description: "Veiculo atualizado com sucesso!", variant: "success" });
                    setEditOpen(false);
                    setSelected(null);
                  } catch (e: any) {
                    toast?.({ description: e?.response?.data?.message || "Erro ao atualizar veiculo" });
                  }
                }}>Salvar</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-yellow-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja deletar este veiculo?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-yellow-300 text-yellow-800 hover:bg-yellow-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={async () => {
              if (!selected) return;
              try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                await axios.delete(
                  `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${selected.id}`,
                  token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
                );
                setVehicles((prev) => prev.filter((v) => v.id !== selected.id));
                toast?.({ description: "Veiculo deletado com sucesso!", variant: "success" });
                setConfirmDelete(false);
                setSelected(null);
              } catch (e: any) {
                toast?.({ description: e?.response?.data?.message || "Erro ao deletar veiculo" });
              }
            }}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminListCard>
  );
}
