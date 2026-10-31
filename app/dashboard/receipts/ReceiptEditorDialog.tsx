"use client";

import type { ChangeEvent, RefObject } from "react";
import Image from "next/image";
import { FileText, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { ModalSkeleton } from "@/components/ui/modal-skeleton";
import type { Receipt, TransactionOption } from "@/features/receipts/view-model";
import dlg from "@/components/dashboard/dialog.module.css";
import styles from "./receipts.module.css";
import { ReceiptTransactionCombobox } from "./ReceiptTransactionCombobox";
import { submitButtonLabel } from "./submit-button-label";

type ReceiptEditorDialogProps = {
  open: boolean;
  editingReceipt: Receipt | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  filePreviewUrl: string | null;
  imagePreviewOpen: boolean;
  fileName: string;
  transaction: string;
  transactionsLoading: boolean;
  availableTransactions: readonly TransactionOption[];
  uploadError: string;
  saving: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileNameChange: (value: string) => void;
  onTransactionChange: (value: string) => void;
  onPreviewOpen: () => void;
  onPreviewClose: () => void;
  onRemoveFile: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ReceiptEditorDialog({
  open,
  editingReceipt,
  fileInputRef,
  selectedFile,
  filePreviewUrl,
  imagePreviewOpen,
  fileName,
  transaction,
  transactionsLoading,
  availableTransactions,
  uploadError,
  saving,
  onFileChange,
  onFileNameChange,
  onTransactionChange,
  onPreviewOpen,
  onPreviewClose,
  onRemoveFile,
  onClose,
  onSubmit,
}: ReceiptEditorDialogProps) {
  if (!open) return null;
  const heading = editingReceipt ? "Edit receipt" : "Add receipt";
  const submitLabel = submitButtonLabel(saving, editingReceipt);

  return (
    <>
      <Dialog
        label={heading}
        onClose={onClose}
        overlayClassName={dlg.overlay}
        dialogClassName={dlg.modal}
      >
        <header className={dlg.header}>
          <div className={dlg.heading}>
            <h2>{heading}</h2>
            <p>
              {editingReceipt
                ? "Change the filename or transaction. The review status does not change."
                : "Upload a receipt and assign it to a transaction."}
            </p>
          </div>
          <button
            type="button"
            className={dlg.closeButton}
            aria-label="Close"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={dlg.body}>
          {!editingReceipt ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png"
                hidden
                onChange={onFileChange}
              />
              {selectedFile ? (
                <div className={styles.uploadPreview}>
                  {filePreviewUrl ? (
                    <button
                      type="button"
                      className={styles.uploadPreviewButton}
                      onClick={onPreviewOpen}
                      aria-label={`Open full preview of ${selectedFile.name}`}
                    >
                      <Image
                        width="1200"
                        height="900"
                        src={filePreviewUrl}
                        alt={`Preview of ${selectedFile.name}`}
                        className={styles.uploadPreviewImage}
                        unoptimized
                      />
                    </button>
                  ) : (
                    <FileText className={styles.uploadPreviewIcon} aria-hidden="true" />
                  )}
                  <div className={styles.uploadPreviewMeta}>
                    <strong>{selectedFile.name}</strong>
                    <span>
                      {selectedFile.type === "application/pdf" ? "PDF document" : "Image file"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFileButton}
                    onClick={onRemoveFile}
                    aria-label={`Remove ${selectedFile.name}`}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.uploadArea}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className={styles.uploadText}>
                    <strong>Add a file</strong>
                    <span>PDF, JPG or PNG up to 5 MB. On a phone you can use the camera.</span>
                  </span>
                  <span className={styles.uploadButton}>Choose file</span>
                </button>
              )}
            </>
          ) : null}

          <label className={dlg.field}>
            <span>Filename</span>
            <input
              value={fileName}
              onChange={(event) => onFileNameChange(event.target.value)}
              placeholder="For example, receipt-may-2026.pdf"
            />
          </label>

          {transactionsLoading ? (
            <ModalSkeleton />
          ) : (
            <ReceiptTransactionCombobox
              value={transaction}
              onChange={onTransactionChange}
              options={availableTransactions}
            />
          )}
        </div>

        {uploadError ? <p className={dlg.dialogError} role="alert">{uploadError}</p> : null}

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
            className={dlg.primaryButton}
            onClick={onSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            {submitLabel}
          </button>
        </footer>
      </Dialog>

      {imagePreviewOpen && filePreviewUrl && selectedFile ? (
        <div
          className={styles.imageLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Full preview of ${selectedFile.name}`}
          onClick={onPreviewClose}
        >
          <button
            type="button"
            className={styles.imageLightboxClose}
            onClick={onPreviewClose}
            aria-label="Close image preview"
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
          <Image
            width="1600"
            height="1200"
            src={filePreviewUrl}
            alt={`Full preview of ${selectedFile.name}`}
            className={styles.imageLightboxImage}
            onClick={(event) => event.stopPropagation()}
            unoptimized
          />
        </div>
      ) : null}
    </>
  );
}
