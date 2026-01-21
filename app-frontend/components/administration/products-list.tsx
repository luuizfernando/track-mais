"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Maximize2, Pencil, Trash2 } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

interface ApiProduct {
  code: number;
  description: string;
  group: string;
  company: string;
  last_buying_date: string | null;
  last_sale_date: string | null;
}

type ApiResponse = {
  data: ApiProduct[];
  limit: number;
  offset: number;
  total?: number;
};

interface ProductsListProps {
  onAdd: () => void;
}

export function ProductsList({ onAdd }: ProductsListProps) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const limit = 10;
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ApiProduct | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState<{ description: string; group: string; company: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const offset = page * limit;

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const res = await axios.get<ApiResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/products?limit=${limit}&offset=${offset}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );

        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setProducts(list);

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
            : "Erro ao carregar produtos."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, limit]);

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString.trim() === "") return "-";

    const onlyDate = dateString.split("T")[0];
    if (onlyDate === "0000-01-01") return "-";

    const [year, month, day] = onlyDate.split("-");
    if (!year || !month || !day) {
      return "-";
    }

    const yearNumber = Number(year);
    const monthNumber = Number(month);
    const dayNumber = Number(day);
    if (
      Number.isNaN(yearNumber) ||
      Number.isNaN(monthNumber) ||
      Number.isNaN(dayNumber)
    ) {
      return "-";
    }

    return `${day}/${month}/${year}`;
  };

  const openEdit = (product: ApiProduct) => {
    setSelected(product);
    setEditForm({ description: product.description, group: product.group, company: product.company });
    setEditOpen(true);
  };

  const openDelete = (product: ApiProduct) => {
    setSelected(product);
    setConfirmDelete(true);
  };

  const handleEditChange = (field: keyof NonNullable<typeof editForm>, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const submitEdit = async () => {
    if (!selected || !editForm) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${selected.code}`,
        {
          description: editForm.description,
          group: editForm.group,
          company: editForm.company,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setProducts((prev) => prev.map((p) => (p.code === selected.code ? { ...p, ...editForm } as ApiProduct : p)));
      toast?.({ description: "Produto atualizado com sucesso!", variant: "success" });
      setEditOpen(false);
      setSelected(null);
    } catch (e: any) {
      toast?.({ description: e?.response?.data?.message || "Erro ao atualizar produto" });
    }
  };

  const confirmDeleteAction = async () => {
    if (!selected) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${selected.code}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setProducts((prev) => prev.filter((p) => p.code !== selected.code));
      toast?.({ description: "Produto deletado com sucesso!", variant: "success" });
      setConfirmDelete(false);
      setSelected(null);
    } catch (e: any) {
      toast?.({ description: e?.response?.data?.message || "Erro ao deletar produto" });
    }
  };

  if (loading) {
    return (
      <AdminListCard
        meta={TAB_CONFIG.produtos}
        onAdd={onAdd}
        showHeader={true}
        actionPlacement="footer"
      >
        <div className="p-4 text-gray-500">Carregando produtos.</div>
      </AdminListCard>
    );
  }

  if (error) {
    return (
      <AdminListCard
        meta={TAB_CONFIG.produtos}
        onAdd={onAdd}
        showHeader={true}
        actionPlacement="footer"
      >
        <div className="p-4 text-red-600">{error}</div>
      </AdminListCard>
    );
  }

  if (products.length === 0) {
    return (
      <AdminListCard
        meta={TAB_CONFIG.produtos}
        onAdd={onAdd}
        showHeader={true}
        actionPlacement="footer"
      >
        <div className="p-4 text-gray-500">Nenhum produto encontrado.</div>
      </AdminListCard>
    );
  }

  return (
    <AdminListCard
      meta={TAB_CONFIG.produtos}
      onAdd={onAdd}
      showHeader={true}
      actionPlacement="footer"
    >
      {isMobile ? (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.code} className="p-4">
              <CardContent className="p-0">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{product.description}</p>
                      <p className="text-sm text-gray-600">Grupo: {product.group}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => openDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Código:</strong> {product.code}</p>
                    <p><strong>Marca:</strong> {product.company}</p>
                    <p><strong>Última Compra:</strong> {formatDate(product.last_buying_date)}</p>
                    <p><strong>Última Venda:</strong> {formatDate(product.last_sale_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow className="text-gray-500">
                <TableHead className="w-[90px]">Cod.</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Dt. Ultima Compra</TableHead>
                <TableHead>Dt. Ultima Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.code} className="text-gray-700">
                  <TableCell className="font-medium text-gray-900">
                    {product.code}
                  </TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{product.group}</TableCell>
                  <TableCell>{product.company}</TableCell>
                  <TableCell>{formatDate(product.last_buying_date)}</TableCell>
                  <TableCell>{formatDate(product.last_sale_date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                        onClick={() => openDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
            <DialogTitle className="text-yellow-800">Editar Produto</DialogTitle>
          </DialogHeader>
          {editForm ? (
            <div className="space-y-3">
              <div>
                <Label>Descricao</Label>
                <Input value={editForm.description} onChange={(e) => handleEditChange("description", e.target.value)} />
              </div>
              <div>
                <Label>Grupo</Label>
                <Input value={editForm.group} onChange={(e) => handleEditChange("group", e.target.value)} />
              </div>
              <div>
                <Label>Marca</Label>
                <Input value={editForm.company} onChange={(e) => handleEditChange("company", e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
            <AlertDialogTitle>Deseja deletar este produto?</AlertDialogTitle>
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
