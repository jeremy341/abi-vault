import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import dlg from "@/components/dashboard/dialog.module.css";
import styles from "@/app/dashboard/funds/funds.module.css";

type ArchiveCardDialogProps = {
  accountName: string | undefined;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ArchiveCardDialog({ accountName, saving, onClose, onConfirm }: ArchiveCardDialogProps) {
  return (
    <Dialog
      label="Archive cash register"
      onClose={onClose}
      overlayClassName={dlg.overlay}
      dialogClassName={`${dlg.modal} ${dlg.modalNarrow}`}
    >
      <header className={dlg.header}>
        <div className={dlg.heading}>
          <h2>Archive cash register?</h2>
          <p>The cash register will be removed from active views. Its entries stay in the history.</p>
        </div>
        <button
          type="button"
          className={dlg.closeButton}
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={dlg.body}>
        <p className={styles.confirmationName}>{accountName}</p>
      </div>
      <footer className={dlg.footer}>
        <button
          type="button"
          className={dlg.secondaryButton}
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className={dlg.destructiveButton}
          onClick={onConfirm}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? "Archiving" : "Archive cash register"}
        </button>
      </footer>
    </Dialog>
  );
}
