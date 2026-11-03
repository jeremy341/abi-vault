import { LoadingCollection } from "@/components/ui/loading-state";
import styles from "./people.module.css";
import ledger from "../ledger.module.css";
import type { Person } from "./people-types";

type MemberTableProps = {
  loading: boolean;
  people: Person[];
  filteredPeople: Person[];
  busyPersonId: string | null;
  onChangeRole: (personId: string) => void;
  onRemove: (personId: string) => void;
};

export function MemberTable({
  loading,
  people,
  filteredPeople,
  busyPersonId,
  onChangeRole,
  onRemove,
}: MemberTableProps) {
  return (
    <div className={ledger.tableWrap}>
      <LoadingCollection loading={loading} knownItemCount={people.length} emptyHeight="12rem" label="Loading members">
        {!loading && !filteredPeople.length ? (
          <p className={ledger.empty}>No members found.</p>
        ) : (
          <table className={ledger.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className={ledger.hideOnPhone}>Role</th>
                <th scope="col" className={ledger.hideOnPhone}>Access</th>
                <th scope="col">Status</th>
                <th scope="col" className={ledger.actions}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map((person) => (
                <tr key={person.id}>
                  <td>
                    <span className={ledger.title}>{person.name}</span>
                    <span className={ledger.phoneMeta}>{person.role}</span>
                  </td>
                  <td className={ledger.hideOnPhone}>{person.role}</td>
                  <td className={`${ledger.muted} ${ledger.hideOnPhone}`}>{person.access}</td>
                  <td className={person.status === "Active" ? ledger.muted : ledger.attention}>{person.status}</td>
                  <td className={ledger.actions}>
                    {person.status !== "Active" ? (
                      <span className={ledger.rowMeta} title="Only active members can be managed here.">
                        No actions
                      </span>
                    ) : (
                      <span className={ledger.inlineActions}>
                        <button type="button" className={`${ledger.textButton} ${styles.rowAction}`} onClick={() => onChangeRole(person.id)} disabled={busyPersonId === person.id} aria-label={`Change role for ${person.name}`}>
                          Change role
                        </button>
                        <button type="button" className={`${ledger.textButton} ${styles.rowAction}`} onClick={() => void onRemove(person.id)} disabled={busyPersonId === person.id} aria-label={`Remove ${person.name}`}>
                          Remove
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </LoadingCollection>
    </div>
  );
}
