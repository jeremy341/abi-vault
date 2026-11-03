import fundsStyles from "./funds.module.css";

type CountPreviewProps = {
  bookBalance: number;
  countedAmount: number;
  difference: number;
  formatMoney: (value: number) => string;
};

export default function CountPreview({ bookBalance, countedAmount, difference, formatMoney }: CountPreviewProps) {
  let differenceClassName = fundsStyles.negative;

  if (Math.abs(difference) < 0.01) {
    differenceClassName = fundsStyles.positive;
  }

  let differenceSign = "";

  if (difference > 0) {
    differenceSign = "+";
  }

  return (
    <dl className={fundsStyles.countPreview} aria-label="Count preview">
      <div>
        <dt>Book balance</dt>
        <dd>{formatMoney(bookBalance)}</dd>
      </div>
      <div>
        <dt>Counted</dt>
        <dd className="total-rule">{formatMoney(countedAmount)}</dd>
      </div>
      <div>
        <dt>Difference</dt>
        <dd className={differenceClassName}>
          {differenceSign}{formatMoney(difference)}
        </dd>
      </div>
    </dl>
  );
}
