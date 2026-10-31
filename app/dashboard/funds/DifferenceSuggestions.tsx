import Link from "next/link";
import ledger from "@/app/dashboard/ledger.module.css";
import type { DifferenceReview } from "@/app/dashboard/funds/difference-review";
import type { DifferenceSuggestion } from "@/lib/finance/difference-detective";

function titleFor(review: DifferenceReview, suggestion: DifferenceSuggestion) {
  const transaction = review.transactions.find((item) => item.id === suggestion.transactionId);

  return transaction?.title ?? "A recorded transaction";
}

function messageFor(review: DifferenceReview, suggestion: DifferenceSuggestion) {
  let message = "No recorded transaction explains this difference. Recount and add a note.";

  if (suggestion.kind === "double-entry") {
    message = `${titleFor(review, suggestion)} may be entered twice.`;
  } else if (suggestion.kind === "wrong-entry") {
    message = `${titleFor(review, suggestion)} may have the wrong amount.`;
  } else if (suggestion.kind === "sign-flip") {
    message = `${titleFor(review, suggestion)} may be recorded as the wrong type.`;
  } else if (suggestion.kind === "digits-swapped") {
    message = `${titleFor(review, suggestion)} may have two digits in the wrong order.`;
  } else if (suggestion.kind === "denomination") {
    message = "The difference matches a coin or note. Recount the register.";
  } else if (suggestion.kind === "unrecorded-expense") {
    message = "Cash is missing. An expense may have been paid and not recorded.";
  }

  if (suggestion.periodLocked) {
    message = `${message} Its accounting period is locked.`;
  }

  return message;
}

export default function DifferenceSuggestions({ review }: { review: DifferenceReview }) {
  if (review.suggestions.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="difference-suggestions">
      <h3 id="difference-suggestions">Possible causes</h3>
      <ul className={ledger.list}>
        {review.suggestions.map((suggestion, index) => (
          <li key={`${suggestion.kind}-${index}`}>
            {messageFor(review, suggestion)}
            {suggestion.transactionId && !suggestion.periodLocked ? (
              <>
                {" "}
                <Link className={ledger.textButton} href={`/dashboard/transactions?edit=${encodeURIComponent(suggestion.transactionId)}`}>
                  Open transaction
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
