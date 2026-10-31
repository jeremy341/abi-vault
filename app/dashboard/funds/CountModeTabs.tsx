import fundsStyles from "./funds.module.css";

export type CountMode = "direct" | "calculator";

type CountModeTabsProps = {
  countMode: CountMode;
  onChangeMode: (mode: CountMode) => void;
};

export default function CountModeTabs({ countMode, onChangeMode }: CountModeTabsProps) {
  function handleModeKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, currentMode: CountMode) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextMode = currentMode === "direct" ? "calculator" : "direct";
    const nextTabIndex = nextMode === "direct" ? 0 : 1;
    onChangeMode(nextMode);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
      [nextTabIndex]?.focus();
  }

  return (
    <div className={fundsStyles.modeTabs} role="tablist" aria-label="Counting method">
      <button
        type="button"
        role="tab"
        aria-selected={countMode === "direct"}
        aria-controls="count-direct-panel"
        tabIndex={countMode === "direct" ? 0 : -1}
        onKeyDown={(event) => handleModeKeyDown(event, "direct")}
        onClick={() => onChangeMode("direct")}
      >
        Total amount
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={countMode === "calculator"}
        aria-controls="count-calculator-panel"
        tabIndex={countMode === "calculator" ? 0 : -1}
        onKeyDown={(event) => handleModeKeyDown(event, "calculator")}
        onClick={() => onChangeMode("calculator")}
      >
        Denominations
      </button>
    </div>
  );
}
