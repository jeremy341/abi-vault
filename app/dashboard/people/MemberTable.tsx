import { LoadingCollection } from "@/components/ui/loading-state";
import styles from "./people.module.css";
import ledger from "../ledger.module.css";
import type { Person } from "./people-types";
import { isCurrentMember } from "@/features/people/member-display";

type MemberTableProps = {
  loading: boolean;
  people: Person[];
  filteredPeople: Person[];
  userId: string | null;
  onManage: (personId: string) => void;
};

export function MemberTable({ loading, people, filteredPeople, userId, onManage }: MemberTableProps) {
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
                <th scope="col">Role</th>
                <th scope="col" className={ledger.actions}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map((person) => (
                <tr key={person.id}>
                  <td>
                    <span className={ledger.title}>{person.name}{isCurrentMember(person.id, userId) ? " (you)" : ""}</span>
                    {person.status !== "Active" ? <span className={styles.sub}>{person.status}</span> : null}
                  </td>
                  <td>
                    {person.role}
                    <span className={`${styles.sub} ${styles.access}`}>{person.access}</span>
                  </td>
                  <td className={ledger.actions}>
                    {person.status === "Active" ? (
                      <button type="button" className={ledger.secondaryButton} onClick={() => onManage(person.id)} aria-label={`Manage ${person.name}${isCurrentMember(person.id, userId) ? " (you)" : ""}`}>
                        Manage
                      </button>
                    ) : (
                      <span className={ledger.rowMeta}>{person.status}</span>
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
