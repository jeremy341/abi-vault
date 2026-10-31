"use client";

import { useState } from "react";
import { useAppAuth } from "@/components/auth/app-auth";
import {
  LoadingStatus,
  LoadingText,
} from "@/components/ui/loading-state";
import styles from "./people.module.css";
import ledger from "../ledger.module.css";
import { LoadError } from "@/components/ui/load-error";
import { listMembersForCurrentOrganization } from "@/features/finance/actions/queries";
import { useFinanceQuery } from "@/hooks/use-finance-query";
import { useQueryBackedState } from "@/hooks/use-query-backed-state";
import { inviteMember } from "@/features/people/actions/invitations";
import { createRoleInviteLink } from "@/features/people/actions/invite-links";
import {
  removeMember,
  updateMemberRole,
} from "@/features/people/actions/memberships";
import { financeScope } from "@/lib/finance/client-cache";
import { MemberTable } from "./MemberTable";
import { RolesSummary } from "./RolesSummary";
import { InviteLinks } from "./InviteLinks";
import { InviteDialog } from "./InviteDialog";
import type {
  InviteRole,
  Person,
  PersonRole,
  RoleInviteLink,
  RoleLinks,
} from "./people-types";

type RoleLinksState = {
  scope: string;
  links: RoleLinks;
};

type MemberListData = Extract<Awaited<ReturnType<typeof listMembersForCurrentOrganization>>, { ok: true }>;

const nextRoleFor: Record<
  PersonRole,
  { databaseRole: "admin" | "supervisor"; displayRole: PersonRole; access: string }
> = {
  Member: {
    databaseRole: "supervisor",
    displayRole: "Supervisor",
    access: "Manages finances",
  },
  Supervisor: {
    databaseRole: "admin",
    displayRole: "Administrator",
    access: "Full access",
  },
  Administrator: {
    databaseRole: "supervisor",
    displayRole: "Supervisor",
    access: "Manages finances",
  },
};

const emptyPeople: Person[] = [];

function roleNameFor(databaseRole: string): PersonRole {
  if (databaseRole === "admin") {
    return "Administrator";
  }

  if (databaseRole === "supervisor") {
    return "Supervisor";
  }

  return "Member";
}

function accessFor(databaseRole: string): string {
  if (databaseRole === "admin") {
    return "Full access";
  }

  if (databaseRole === "supervisor") {
    return "Manages finances";
  }

  return "Read-only";
}

function statusNameFor(databaseStatus: string): Person["status"] {
  if (databaseStatus === "active") {
    return "Active";
  }

  if (databaseStatus === "invited") {
    return "Invitation pending";
  }

  return "Inactive";
}

function peopleFromMemberList(data: MemberListData): Person[] {
  return data.items.map((member) => ({
    id: member.id,
    name: member.name,
    role: roleNameFor(member.role),
    access: accessFor(member.role),
    status: statusNameFor(member.status),
  }));
}

export default function PeoplePage() {
  const { orgId, userId } = useAppAuth();
  const scope = financeScope(orgId, userId);
  const memberQuery = useFinanceQuery(
    "members",
    listMembersForCurrentOrganization,
    scope,
  );
  const [loadedPeople, setPeople] = useQueryBackedState(
    memberQuery.data?.ok ? memberQuery.data : null,
    peopleFromMemberList,
    emptyPeople,
  );
  const loading = memberQuery.loading;
  const loadError = memberQuery.failed ? "The members could not be loaded." : "";
  const people = loading || memberQuery.failed ? emptyPeople : loadedPeople;
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<InviteRole>("Supervisor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [messageState, setMessageState] = useState<{ scope: string; value: string } | null>(null);
  const message = messageState?.scope === scope ? messageState.value : "";
  const [busyPersonId, setBusyPersonId] = useState<string | null>(null);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [linkSaving, setLinkSaving] = useState<"admin" | "supervisor" | null>(null);
  const [roleLinkState, setRoleLinkState] = useState<RoleLinksState | null>(null);
  const roleLinks = roleLinkState?.scope === scope ? roleLinkState.links : {};

  function setMessage(value: string) {
    setMessageState({ scope, value });
  }

  const searchTerm = query.trim().toLowerCase();
  const filteredPeople = people.filter((person) =>
    `${person.name} ${person.role}`.toLowerCase().includes(searchTerm),
  );
  const counts = {
    active: people.filter((person) => person.status === "Active").length,
    administrators: people.filter((person) => person.role === "Administrator").length,
    supervisors: people.filter((person) => person.role === "Supervisor").length,
    members: people.filter((person) => person.role === "Member").length,
  };

  function openInviteModal() {
    setInviteEmail("");
    setNewRole("Supervisor");
    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setNewRole("Supervisor");
    setInviteEmail("");
    setMessage("");
  }

  async function changeRole(personId: string) {
    if (busyPersonId !== null) return;
    const person = people.find((item) => item.id === personId);

    if (!person) return;
    const next = nextRoleFor[person.role];
    setBusyPersonId(personId);

    try {
      const result = await updateMemberRole({
        clerkUserId: personId,
        role: next.databaseRole,
        reason: "Role changed through member management",
      });

      if (!result.ok) {
        setMessage(result.error.message);

        return;
      }
    } catch {
      setMessage("The role could not be updated.");

      return;
    } finally {
      setBusyPersonId(null);
    }

    setPeople((current) =>
      current.map((item) =>
        item.id === personId
          ? { ...item, role: next.displayRole, access: next.access }
          : item,
      ),
    );
    setMessage("Role updated.");
  }

  async function addPerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inviteSaving) return;
    const email = inviteEmail.trim();

    if (!email) {
      setMessage("Enter an email address.");

      return;
    }

    setInviteSaving(true);
    const role = newRole === "Administrator" ? "admin" : "supervisor";

    try {
      const invitation = await inviteMember({ email, role });

      if (!invitation.ok) {
        setMessage(
          invitation.error.code === "INVALID_INPUT"
            ? "Enter a valid email address and choose a role."
            : invitation.error.message,
        );

        return;
      }

      setInviteEmail("");
      setMessage(`Invitation sent to ${email}.`);
    } catch {
      setMessage("The invitation could not be sent.");
    } finally {
      setInviteSaving(false);
    }
  }

  async function removePerson(personId: string) {
    if (busyPersonId !== null) return;
    setBusyPersonId(personId);

    try {
      const result = await removeMember({
        clerkUserId: personId,
        reason: "Member removed through member management",
      });

      if (!result.ok) {
        setMessage(
          result.error.code === "LAST_ADMIN_REQUIRED"
            ? "The last administrator cannot be removed."
            : result.error.message,
        );

        return;
      }

      setPeople((current) => current.filter((person) => person.id !== personId));
      setMessage("Person removed.");
    } catch {
      setMessage("The person could not be removed.");
    } finally {
      setBusyPersonId(null);
    }
  }

  async function createLink(role: RoleInviteLink["role"]) {
    if (linkSaving) return;
    setLinkSaving(role);
    setMessage("");

    try {
      const result = await createRoleInviteLink({ role });

      if (!result.ok) {
        setMessage(result.error.message);

        return;
      }

      setRoleLinkState((current) => {
        const previousLinks = current?.scope === scope ? current.links : {};

        return { scope, links: { ...previousLinks, [role]: result.data } };
      });
      setMessage(`${role === "admin" ? "Admin" : "Supervisor"} link created.`);
    } catch {
      setMessage("The invitation link could not be created.");
    } finally {
      setLinkSaving(null);
    }
  }

  async function copyLink(role: RoleInviteLink["role"]) {
    const link = roleLinks[role];

    if (!link) return;

    try {
      await navigator.clipboard.writeText(link.url);
      setMessage("Invitation link copied.");
    } catch {
      setMessage("The link could not be copied. Select and copy it manually.");
    }
  }

  return (
    <section className={ledger.page} aria-busy={loading}>
      <LoadingStatus loading={loading} label="Loading members" />
      {loadError ? <LoadError message={loadError} /> : null}

      <div className={ledger.summary}>
        <dl className={ledger.figures}>
          <div>
            <dt>Members</dt>
            <dd><LoadingText loading={loading}>{people.length}</LoadingText></dd>
          </div>
          <div>
            <dt>Active</dt>
            <dd><LoadingText loading={loading}>{counts.active}</LoadingText></dd>
          </div>
          <div>
            <dt>Administrators</dt>
            <dd><LoadingText loading={loading}>{counts.administrators}</LoadingText></dd>
          </div>
        </dl>
        <button type="button" className={ledger.primaryButton} onClick={openInviteModal} disabled={loading}>
          Add person
        </button>
      </div>

      <div className={ledger.cols}>
        <div className={ledger.col}>
          <div className={`${ledger.toolbar} ${styles.toolbar}`}>
            <label className={ledger.searchField}>
              <span className="sr-only">Search members</span>
              <input
                id="people-search"
                value={query}
                disabled={loading}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or role"
              />
            </label>
          </div>

          <MemberTable
            loading={loading}
            people={people}
            filteredPeople={filteredPeople}
            busyPersonId={busyPersonId}
            onChangeRole={changeRole}
            onRemove={removePerson}
          />
          <p className={`${ledger.notice} ${styles.notice}`} aria-live="polite">{message}</p>
        </div>

        <div className={ledger.col}>
          <RolesSummary counts={counts} />
          <InviteLinks
            roleLinks={roleLinks}
            linkSaving={linkSaving}
            onCreateLink={createLink}
            onCopyLink={copyLink}
          />
        </div>
      </div>

      {modalOpen ? (
        <InviteDialog
          inviteEmail={inviteEmail}
          newRole={newRole}
          message={message}
          inviteSaving={inviteSaving}
          onEmailChange={setInviteEmail}
          onRoleChange={setNewRole}
          onSubmit={addPerson}
          onClose={closeModal}
        />
      ) : null}
    </section>
  );
}
