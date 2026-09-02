"use client";

import {
  Archive,
  Eye,
  MoreVertical,
  Pencil,
  ShieldCheck,
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
  onReceipt?: () => void;
  receiptLabel?: string;
  editDisabledLabel?: string;
  deleteDisabledLabel?: string;
};

export function RowActionMenu({
  label,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onReceipt,
  receiptLabel = "Review receipt",
  editDisabledLabel = "Only the creator or an admin can edit.",
  deleteDisabledLabel = "Only admins can archive.",
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
        {onReceipt ? (
          <DropdownMenuItem onClick={onReceipt}>
            {receiptLabel === "Review receipt" ? <ShieldCheck aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {receiptLabel}
          </DropdownMenuItem>
        ) : null}
        {onReceipt ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          disabled={!canEdit}
          aria-label={canEdit ? "Edit" : editDisabledLabel}
          title={canEdit ? undefined : editDisabledLabel}
          onClick={canEdit ? onEdit : undefined}
        >
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canDelete}
          aria-label={canDelete ? "Delete" : deleteDisabledLabel}
          variant="destructive"
          title={canDelete ? undefined : deleteDisabledLabel}
          onClick={canDelete ? onDelete : undefined}
        >
          <Archive aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
