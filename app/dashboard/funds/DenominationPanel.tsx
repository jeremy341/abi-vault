import fundsStyles from "./funds.module.css";

const denominations = [
  ["50", "$50 bills"],
  ["20", "$20 bills"],
  ["10", "$10 bills"],
  ["5", "$5 bills"],
  ["2", "$2 coins"],
  ["1", "$1 coins"],
  ["0.5", "$0.50 coins"],
  ["0.2", "$0.20 coins"],
  ["0.1", "$0.10 coins"],
] as const;

type DenominationPanelProps = {
  counts: Record<string, number>;
  formatMoney: (value: number) => string;
  onCountChange: (denomination: string, count: number) => void;
};

export default function DenominationPanel({ counts, formatMoney, onCountChange }: DenominationPanelProps) {
  return (
    <div
      id="count-calculator-panel"
      className={fundsStyles.denominationGrid}
      role="tabpanel"
      aria-label="Denominations"
    >
      {denominations.map(([value, label]) => (
        <label className={fundsStyles.denominationItem} key={value}>
          <span>{label}</span>
          <input
            name={`denomination-${value}`}
            type="number"
            inputMode="numeric"
            min="0"
            autoComplete="off"
            value={counts[value] || ""}
            onChange={(event) =>
              onCountChange(value, Number.parseInt(event.target.value, 10) || 0)
            }
            placeholder="0"
          />
          <output className={fundsStyles.denominationTotal}>
            {formatMoney((counts[value] || 0) * Number(value))}
          </output>
        </label>
      ))}
    </div>
  );
}
