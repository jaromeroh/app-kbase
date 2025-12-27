"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  User,
  Settings,
  Database,
  LogOut,
  Trash2,
  Download,
  Loader2,
  Save,
  AlertTriangle,
  Video,
  FileText,
  BookOpen,
  FolderOpen,
  Tag,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  UserPreferences,
  DefaultView,
  DefaultSort,
  SortOrder,
  ItemsPerPage,
} from "@/types";

interface SettingsClientProps {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

type Tab = "profile" | "display" | "data" | "account";

interface Stats {
  total_content: number;
  videos: number;
  articles: number;
  books: number;
  pending: number;
  completed: number;
  lists: number;
  tags: number;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState<"json" | "csv" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [defaultView, setDefaultView] = useState<DefaultView>("list");
  const [defaultSort, setDefaultSort] = useState<DefaultSort>("created_at");
  const [defaultSortOrder, setDefaultSortOrder] = useState<SortOrder>("desc");
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPage>(20);

  // Fetch preferences and stats on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [prefsRes, statsRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/stats"),
        ]);

        if (prefsRes.ok) {
          const prefs = await prefsRes.json();
          setPreferences(prefs);
          setDisplayName(prefs.display_name || "");
          setDefaultView(prefs.default_view);
          setDefaultSort(prefs.default_sort);
          setDefaultSortOrder(prefs.default_sort_order);
          setItemsPerPage(prefs.items_per_page);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName || null }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPreferences(updated);
        showMessage("success", "Perfil actualizado correctamente");
      } else {
        showMessage("error", "Error al guardar el perfil");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showMessage("error", "Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDisplay = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_view: defaultView,
          default_sort: defaultSort,
          default_sort_order: defaultSortOrder,
          items_per_page: itemsPerPage,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPreferences(updated);
        showMessage("success", "Preferencias actualizadas correctamente");
      } else {
        showMessage("error", "Error al guardar las preferencias");
      }
    } catch (error) {
      console.error("Error saving display preferences:", error);
      showMessage("error", "Error al guardar las preferencias");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    setIsExporting(format);
    try {
      const res = await fetch(`/api/export?format=${format}`);

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kbase-export-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showMessage("success", `Datos exportados en formato ${format.toUpperCase()}`);
      } else {
        showMessage("error", "Error al exportar los datos");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      showMessage("error", "Error al exportar los datos");
    } finally {
      setIsExporting(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "eliminar mi cuenta") {
      showMessage("error", "Por favor escribe 'eliminar mi cuenta' para confirmar");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });

      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        showMessage("error", "Error al eliminar la cuenta");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showMessage("error", "Error al eliminar la cuenta");
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Perfil", icon: <User className="w-4 h-4" /> },
    { id: "display", label: "Visualización", icon: <Settings className="w-4 h-4" /> },
    { id: "data", label: "Datos", icon: <Database className="w-4 h-4" /> },
    { id: "account", label: "Cuenta", icon: <LogOut className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message toast */}
      {message && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg",
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          )}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-2xl">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>
                Información de tu cuenta y nombre para mostrar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and basic info */}
              <div className="flex items-center gap-4">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "Avatar"}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{user.name || "Usuario"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Display name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre para mostrar</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre personalizado (opcional)"
                />
                <p className="text-xs text-muted-foreground">
                  Este nombre se usará en lugar del nombre de tu cuenta OAuth
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar cambios
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Display Tab */}
        {activeTab === "display" && (
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Visualización</CardTitle>
              <CardDescription>
                Configura cómo se muestran tus contenidos por defecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default view */}
              <div className="space-y-2">
                <Label>Vista por defecto</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultView"
                      value="list"
                      checked={defaultView === "list"}
                      onChange={(e) => setDefaultView(e.target.value as DefaultView)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Lista</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultView"
                      value="grid"
                      checked={defaultView === "grid"}
                      onChange={(e) => setDefaultView(e.target.value as DefaultView)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Grid</span>
                  </label>
                </div>
              </div>

              {/* Default sort */}
              <div className="space-y-2">
                <Label htmlFor="defaultSort">Ordenar por</Label>
                <select
                  id="defaultSort"
                  value={defaultSort}
                  onChange={(e) => setDefaultSort(e.target.value as DefaultSort)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
                >
                  <option value="created_at">Fecha de creación</option>
                  <option value="updated_at">Fecha de actualización</option>
                  <option value="title">Título</option>
                  <option value="rating">Calificación</option>
                </select>
              </div>

              {/* Sort order */}
              <div className="space-y-2">
                <Label>Orden</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={defaultSortOrder === "desc"}
                      onChange={(e) => setDefaultSortOrder(e.target.value as SortOrder)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Descendente (más reciente primero)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={defaultSortOrder === "asc"}
                      onChange={(e) => setDefaultSortOrder(e.target.value as SortOrder)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>Ascendente</span>
                  </label>
                </div>
              </div>

              {/* Items per page */}
              <div className="space-y-2">
                <Label htmlFor="itemsPerPage">Items por página</Label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value) as ItemsPerPage)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <Button onClick={handleSaveDisplay} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar preferencias
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Data Tab */}
        {activeTab === "data" && (
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
                <CardDescription>Resumen de tu biblioteca de conocimiento</CardDescription>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Video className="w-4 h-4" />
                        <span className="text-xs">Videos</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.videos}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Artículos</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.articles}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs">Libros</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.books}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Database className="w-4 h-4" />
                        <span className="text-xs">Total</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.total_content}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Completados</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.completed}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Pendientes</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.pending}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-xs">Listas</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.lists}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Tag className="w-4 h-4" />
                        <span className="text-xs">Tags</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.tags}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Cargando estadísticas...</p>
                )}
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle>Exportar Datos</CardTitle>
                <CardDescription>
                  Descarga una copia de todos tus datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exporta todos tus contenidos, listas y tags en el formato que prefieras.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleExport("json")}
                    disabled={isExporting !== null}
                  >
                    {isExporting === "json" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Exportar JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport("csv")}
                    disabled={isExporting !== null}
                  >
                    {isExporting === "csv" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Logout */}
            <Card>
              <CardHeader>
                <CardTitle>Sesión</CardTitle>
                <CardDescription>Cerrar sesión en este dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Zona de peligro
                </CardTitle>
                <CardDescription>
                  Acciones irreversibles que afectan tu cuenta permanentemente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showDeleteConfirm ? (
                  <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar mi cuenta y todos mis datos
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/50">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Esta acción eliminará permanentemente:
                    </p>
                    <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                      <li>Tu cuenta de usuario</li>
                      <li>Todos tus contenidos (videos, artículos, libros)</li>
                      <li>Todas tus listas y tags</li>
                      <li>Todas tus preferencias</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                      Escribe <strong>eliminar mi cuenta</strong> para confirmar:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="eliminar mi cuenta"
                      className="max-w-sm"
                    />
                    <div className="flex gap-4">
                      <Button
                        variant="danger"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmText !== "eliminar mi cuenta"}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Confirmar eliminación
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
