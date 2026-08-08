"use client";

import { X } from "lucide-react";
import { useState } from "react";
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

type AddCardModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (details: AccountCardDetails) => void;
};

type FormValues = Omit<AccountCardDetails, "color">;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
    accountName: "Bankkonto",
    cardNumber: "5789 **** **** 2847",
    holder: "Mike Smith",
    expiry: "06/21",
};

function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function AddCardModal({ open, onClose, onSave }: AddCardModalProps) {
    const [selectedColor, setSelectedColor] = useState(cardColors[0].value);
    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});

    if (!open) return null;

    function updateValue(field: keyof FormValues, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    }

    function validate() {
        const nextErrors: FormErrors = {};
        if (!values.accountName.trim()) nextErrors.accountName = "Bitte einen Kontonamen eingeben.";
        if (values.cardNumber.replace(/\D/g, "").length !== 16) {
            nextErrors.cardNumber = "Die Kartennummer muss 16 Ziffern enthalten.";
        }
        if (!values.holder.trim()) nextErrors.holder = "Bitte den Karteninhaber eingeben.";
        const expiryMatch = /^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry);
        if (!expiryMatch) nextErrors.expiry = "Format: MM/YY, zum Beispiel 06/21.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        onSave({ ...values, color: selectedColor });
        setValues(initialValues);
        setErrors({});
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
            <form
                onSubmit={handleSubmit}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-card-title"
                className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 shadow-2xl sm:p-7 dark:border-white/10 dark:bg-card"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Neue Karte</p>
                        <h2 id="add-card-title" className="mt-1 text-2xl font-semibold tracking-tight">Karte hinzufügen</h2>
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label="Dialog schließen" onClick={onClose}>
                        <X />
                    </Button>
                </div>

                <div className="mt-6 flex justify-center rounded-xl bg-[#f7f7f5] px-4 py-6 dark:bg-black/20">
                    <AccountCard cardColor={selectedColor} details={values} />
                </div>

                <div className="my-6 h-px bg-black/10 dark:bg-white/10" />

                <section aria-labelledby="card-colors-title">
                    <h3 id="card-colors-title" className="text-sm font-semibold">Farben</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {cardColors.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                aria-label={`${color.name} auswählen`}
                                aria-pressed={selectedColor === color.value}
                                className={`size-9 rounded-full border border-black/15 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selectedColor === color.value ? "ring-2 ring-black ring-offset-2" : ""}`}
                                style={{ backgroundColor: color.value }}
                                onClick={() => setSelectedColor(color.value)}
                            />
                        ))}
                    </div>
                </section>

                <div className="my-6 h-px bg-black/10 dark:bg-white/10" />

                <section aria-labelledby="card-information-title">
                    <h3 id="card-information-title" className="text-sm font-semibold">Karteninformationen</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Kontoname" error={errors.accountName}>
                            <Input required maxLength={32} value={values.accountName} onChange={(event) => updateValue("accountName", event.target.value)} placeholder="Zum Beispiel Klassenkonto" />
                        </Field>
                        <Field label="Kartennummer" error={errors.cardNumber}>
                            <Input required inputMode="numeric" maxLength={19} value={values.cardNumber} onChange={(event) => updateValue("cardNumber", formatCardNumber(event.target.value))} placeholder="1234 5678 9012 3456" />
                        </Field>
                        <Field label="Karteninhaber" error={errors.holder}>
                            <Input required maxLength={40} value={values.holder} onChange={(event) => updateValue("holder", event.target.value)} placeholder="Vor- und Nachname" />
                        </Field>
                        <Field label="Ablaufdatum" error={errors.expiry}>
                            <Input required inputMode="numeric" maxLength={5} value={values.expiry} onChange={(event) => updateValue("expiry", formatExpiry(event.target.value))} placeholder="MM/YY" />
                        </Field>
                    </div>
                </section>

                <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/85">Karte hinzufügen</Button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="grid gap-1.5 text-sm font-medium">
            {label}
            {children}
            {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
        </label>
    );
}
