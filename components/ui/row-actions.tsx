"use client";

import {
  Archive,
  MoreVertical,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowActionMenuProps = {
  label: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  editDisabledLabel?: string;
  deleteDisabledLabel?: string;
};

export function RowActionMenu({
  label,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  editDisabledLabel = "Nur der Ersteller oder ein Admin kann bearbeiten.",
  deleteDisabledLabel = "Nur Admins können archivieren.",
}: RowActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`${label} Optionen`}
            title={`${label} Optionen`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        }
      >
        <MoreVertical aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem
          disabled={!canEdit}
          aria-label={canEdit ? "Bearbeiten" : editDisabledLabel}
          title={canEdit ? undefined : editDisabledLabel}
          onClick={canEdit ? onEdit : undefined}
        >
          <Pencil aria-hidden="true" />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canDelete}
          aria-label={canDelete ? "Löschen" : deleteDisabledLabel}
          variant="destructive"
          title={canDelete ? undefined : deleteDisabledLabel}
          onClick={canDelete ? onDelete : undefined}
        >
          <Archive aria-hidden="true" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
