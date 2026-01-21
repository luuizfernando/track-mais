"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminListCard } from "./list-card"
import { TAB_CONFIG } from "./config"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent } from "@/components/ui/card"

type ApiUser = {
  id: number
  name: string
  username: string
  role: "admin" | "user"
  active: boolean
}

type ApiResponse = {
  data: ApiUser[][]
  limit: number
  offset: number
}

interface UserRow {
  id: number
  name: string
  username: string
  role: string
  status: "Ativo" | "Desativado"
}

const STATUS_CLASS_MAP: Record<UserRow["status"], string> = {
  Ativo: "bg-green-100 text-green-700 hover:bg-green-100",
  Desativado: "bg-gray-200 text-gray-600 hover:bg-gray-200",
}

const ROLE_LABEL: Record<ApiUser["role"], string> = {
  admin: "Administrador",
  user: "Usuário Comum",
}

interface UsersListProps {
  onAdd: () => void
}

const USERS_ROUTE = "/usuarios"

export function UsersList({ onAdd }: UsersListProps) {
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // paginação
  const [page, setPage] = useState(0)
  const limit = 13
  const [hasNext, setHasNext] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editForm, setEditForm] = useState<{ name: string; username: string; role: "admin" | "user"; password?: string } | null>(null)

  const fetchUsers = async (offset: number) => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const res = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}${USERS_ROUTE}?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const list = (res.data?.data ?? []).flat()
      const mapped: UserRow[] = list.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: ROLE_LABEL[u.role] ?? u.role,
        status: u.active ? "Ativo" : "Desativado",
      }))

      setRows(mapped)

      // se o número de retornos == limit, assumimos que pode ter próxima
      setHasNext(list.length === limit)
    } catch (e: any) {
      console.error(e)
      setError(
        e?.response?.status === 401
          ? "Não autorizado: verifique seu login/token."
          : "Erro ao carregar usuários."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page * limit)
  }, [page])

  const openEdit = (user: UserRow) => {
    setSelected(user)
    const roleKey = user.role.includes("Admin") ? "admin" : "user"
    setEditForm({ name: user.name, username: user.username, role: roleKey as "admin" | "user" })
    setEditOpen(true)
  }

  const openDelete = (user: UserRow) => {
    setSelected(user)
    setConfirmDelete(true)
  }

  const submitEdit = async () => {
    if (!selected || !editForm) return
    try {
      const token = localStorage.getItem("token")
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}${USERS_ROUTE}/${selected.id}`,
        {
          name: editForm.name,
          username: editForm.username,
          role: editForm.role,
          password: editForm.password,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, name: editForm.name, username: editForm.username, role: ROLE_LABEL[editForm.role] } : r)))
      toast?.({ description: "Usuario atualizado com sucesso!", variant: "success" })
      setEditOpen(false)
      setSelected(null)
    } catch (e: any) {
      toast?.({ description: e?.response?.data?.message || "Erro ao atualizar usuario" })
    }
  }

  const confirmDeleteAction = async () => {
    if (!selected) return
    try {
      const token = localStorage.getItem("token")
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}${USERS_ROUTE}/${selected.id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      setRows((prev) => prev.filter((r) => r.id !== selected.id))
      toast?.({ description: "Usuario deletado com sucesso!", variant: "success" })
      setConfirmDelete(false)
      setSelected(null)
    } catch (e: any) {
      toast?.({ description: e?.response?.data?.message || "Erro ao deletar usuario" })
    }
  }

  if (loading) {
    return (
      <AdminListCard meta={TAB_CONFIG.usuarios} onAdd={onAdd} showHeader actionPlacement="footer">
        <div className="p-4 text-gray-500">Carregando usuários…</div>
      </AdminListCard>
    )
  }

  if (error) {
    return (
      <AdminListCard meta={TAB_CONFIG.usuarios} onAdd={onAdd} showHeader actionPlacement="footer">
        <div className="p-4 text-red-600">{error}</div>
      </AdminListCard>
    )
  }

  if (rows.length === 0) {
    return (
      <AdminListCard meta={TAB_CONFIG.usuarios} onAdd={onAdd} showHeader actionPlacement="footer">
        <div className="p-4 text-gray-500">Nenhum usuário encontrado.</div>
      </AdminListCard>
    )
  }

  return (
    <AdminListCard meta={TAB_CONFIG.usuarios} onAdd={onAdd} showHeader actionPlacement="footer">
      {isMobile ? (
        <div className="space-y-4">
          {rows.map((user, index) => (
            <Card key={`${user.id}-${index}`} className="p-4">
              <CardContent className="p-0">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => openDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_CLASS_MAP[user.status]}>{user.status}</Badge>
                    <span className="text-sm text-gray-600">{user.role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="text-gray-500">
              <TableHead>Nome</TableHead>
              <TableHead>Nome de usuário</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((user, index) => (
              <TableRow key={`${user.id}-${index}`} className="text-gray-700">
                <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className="text-center">
                  <Badge className={STATUS_CLASS_MAP[user.status]}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900" onClick={() => openEdit(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900" onClick={() => openDelete(user)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* controles de paginação */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
        >
          ← Anterior
        </Button>
        <span className="text-sm text-gray-600">Página {page + 1}</span>
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Próximo →
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl border-yellow-200">
          <DialogHeader>
            <DialogTitle className="text-yellow-800">Editar Usuario</DialogTitle>
          </DialogHeader>
          {editForm ? (
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))} />
              </div>
              <div>
                <Label>Username</Label>
                <Input value={editForm.username} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, username: e.target.value } : prev))} />
              </div>
              <div>
                <Label>Perfil</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((prev) => (prev ? { ...prev, role: v as "admin" | "user" } : prev))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário Comum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Senha (opcional)</Label>
                <Input type="password" value={editForm.password ?? ""} onChange={(e) => setEditForm((prev) => (prev ? { ...prev, password: e.target.value } : prev))} />
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
            <AlertDialogTitle>Deseja deletar este usuario?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-yellow-300 text-yellow-800 hover:bg-yellow-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={confirmDeleteAction}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminListCard>
  )
}
