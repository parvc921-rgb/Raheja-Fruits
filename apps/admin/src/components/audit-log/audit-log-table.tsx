"use client";

import { Fragment, useState } from "react";
import { useAdmins } from "@/lib/admins";
import { formatAction, summarizeChange } from "@/lib/audit-summary";
import { formatDate } from "@/lib/format";
import type { AuditLogEntry } from "@raheja/shared";

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  const { admins } = useAdmins();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const actorName = (actorId: string) => admins.find((a) => a.id === actorId)?.name ?? actorId;

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No audit log entries match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Actor</th>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium">Target</th>
            <th className="px-3 py-2 font-medium">Summary</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <Fragment key={entry.id}>
                <tr className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {formatDate(entry.timestamp)}
                  </td>
                  <td className="px-3 py-2">
                    {actorName(entry.actorId)}
                    <span className="text-muted-foreground"> · {entry.actorRole}</span>
                  </td>
                  <td className="px-3 py-2 font-medium">{formatAction(entry.action)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {entry.targetType}
                    <span className="block text-xs">{entry.targetId}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {summarizeChange(entry.before, entry.after)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {expanded ? "Hide" : "Details"}
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={6} className="px-3 py-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">Before</p>
                          <pre className="overflow-x-auto rounded-md bg-background p-2 text-xs">
                            {entry.before ? JSON.stringify(entry.before, null, 2) : "null"}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">After</p>
                          <pre className="overflow-x-auto rounded-md bg-background p-2 text-xs">
                            {entry.after ? JSON.stringify(entry.after, null, 2) : "null"}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
