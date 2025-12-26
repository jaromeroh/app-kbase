"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Trash2, Plus, Pencil } from "lucide-react";
import { AddContentToListModal } from "@/components/lists/AddContentToListModal";
import { EditListModal } from "@/components/lists/EditListModal";

interface ListDetailClientProps {
  listId: string;
  listName: string;
  listDescription: string;
  listColor: string;
  existingContentIds: string[];
}

export function ListDetailClient({
  listId,
  listName,
  listDescription,
  listColor,
  existingContentIds,
}: ListDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta lista? El contenido no será eliminado."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/lists");
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting list:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir contenido
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <AddContentToListModal
        listId={listId}
        listName={listName}
        existingContentIds={existingContentIds}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditListModal
        listId={listId}
        currentName={listName}
        currentDescription={listDescription}
        currentColor={listColor}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
