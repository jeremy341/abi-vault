"use client";

import { useState } from "react";
import { X } from "lucide-react";
import AccountCard, { type AccountCardDetails } from "@/components/dashboard/AccountCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const cardColors = [
    { name: "Schwarz", value: "#111114" },
    { name: "Graphit", value: "#3b3b40" },
    { name: "Weiß", value: "#e9e9e7" },
    { name: "Waldgrün", value: "#25453b" },
    { name: "Burgunder", value: "#542f38" },
    { name: "Navy", value: "#26364d" },
    { name: "Sand", value: "#9a8d78" },
    { name: "Terrakotta", value: "#8b5142" },
];

type EditCardModalProps = {
    open: boolean;
    card: AccountCardDetails | null;
    onClose: () => void;
    onSave: (details: AccountCardDetails) => void;
    onDelete: () => void;
};

type FormValues = Omit<AccountCardDetails, "color">;
type FormErrors = Partial<Record<keyof FormValues, string>>;

function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function EditCardModal({ open, card, onClose, onSave, onDelete }: EditCardModalProps) {
    const [selectedColor, setSelectedColor] = useState(card?.color ?? cardColors[0].value);
    const [values, setValues] = useState<FormValues>({
        accountName: card?.accountName ?? "",
        cardNumber: card?.cardNumber ?? "",
        holder: card?.holder ?? "",
        expiry: card?.expiry ?? "",
    });
    const [errors, setErrors] = useState<FormErrors>({});

    if (!open || !card) return null;

    function updateValue(field: keyof FormValues, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextErrors: FormErrors = {};
        if (!values.accountName.trim()) nextErrors.accountName = "Bitte einen Kontonamen eingeben.";
        if (values.cardNumber.replace(/\D/g, "").length !== 16) nextErrors.cardNumber = "Die Kartennummer muss 16 Ziffern enthalten.";
        if (!values.holder.trim()) nextErrors.holder = "Bitte den Karteninhaber eingeben.";
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry)) nextErrors.expiry = "Format: MM/YY, zum Beispiel 06/21.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSave({ ...values, color: selectedColor });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
            <form
                onSubmit={handleSubmit}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-card-title"
                className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 shadow-2xl sm:p-7 dark:border-white/10 dark:bg-card"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Karte bearbeiten</p>
                        <h2 id="edit-card-title" className="mt-1 text-2xl font-semibold tracking-tight">Karteneinstellungen</h2>
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label="Dialog schließen" onClick={onClose}><X /></Button>
                </div>

                <div className="mt-6 flex justify-center rounded-xl bg-[#f7f7f5] px-4 py-6 dark:bg-black/20">
                    <AccountCard cardColor={selectedColor} details={values} />
                </div>

                <div className="my-6 h-px bg-black/10 dark:bg-white/10" />
                <section aria-labelledby="edit-card-colors-title">
                    <h3 id="edit-card-colors-title" className="text-sm font-semibold">Farben</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {cardColors.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                aria-label={`${color.name} auswählen`}
                                aria-pressed={selectedColor === color.value}
                                className={`size-9 rounded-full border border-black/15 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selectedColor === color.value ? "ring-2 ring-black ring-offset-2 dark:ring-white" : ""}`}
                                style={{ backgroundColor: color.value }}
                                onClick={() => setSelectedColor(color.value)}
                            />
                        ))}
                    </div>
                </section>

                <div className="my-6 h-px bg-black/10 dark:bg-white/10" />
                <section aria-labelledby="edit-card-information-title">
                    <h3 id="edit-card-information-title" className="text-sm font-semibold">Karteninformationen</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Kontoname" error={errors.accountName}><Input required maxLength={32} value={values.accountName} onChange={(event) => updateValue("accountName", event.target.value)} /></Field>
                        <Field label="Kartennummer" error={errors.cardNumber}><Input required inputMode="numeric" maxLength={19} value={values.cardNumber} onChange={(event) => updateValue("cardNumber", formatCardNumber(event.target.value))} /></Field>
                        <Field label="Karteninhaber" error={errors.holder}><Input required maxLength={40} value={values.holder} onChange={(event) => updateValue("holder", event.target.value)} /></Field>
                        <Field label="Ablaufdatum" error={errors.expiry}><Input required inputMode="numeric" maxLength={5} value={values.expiry} onChange={(event) => updateValue("expiry", formatExpiry(event.target.value))} /></Field>
                    </div>
                </section>

                <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={onDelete}>Karte löschen</Button>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
                        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/85">Änderungen speichern</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return <label className="grid gap-1.5 text-sm font-medium">{label}{children}{error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}</label>;
}
