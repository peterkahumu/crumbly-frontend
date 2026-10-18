import { useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ADMIN_NAV } from "@/pages/admin/dashboard/index";
import StatCard from "@/components/dashboard/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

export default function AdminsManagement({ initialAdmins = [], currentUserId }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invitedResult, setInvitedResult] = useState(null);

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => !a.isPendingInvite).length;
  const pendingAdmins = admins.filter((a) => a.isPendingInvite).length;

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    setInvitedResult(null);

    try {
      const res = await fetch("/api/admin/admins/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || "Administrator",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to invite administrator");
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInvitedResult(data);

      // Refresh admin list
      const updatedRes = await fetch("/api/admin/admins");
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setAdmins(updatedData);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend(admin) {
    try {
      const res = await fetch("/api/admin/admins/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: admin.email,
          name: admin.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to resend invitation");
      }

      toast.success(`Invitation re-sent to ${admin.email}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRevoke(admin) {
    if (admin.id === currentUserId) {
      toast.error("You cannot revoke your own administrator account.");
      return;
    }

    if (!confirm(`Are you sure you want to revoke administrator access for ${admin.email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to revoke administrator");
      }

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      toast.success(`Revoked access for ${admin.email}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  }

  return (
    <DashboardLayout title="Super Administrators" navItems={ADMIN_NAV}>
      <div className="space-y-6">
        {/* Header Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-cocoa-900">Platform Administrators</h2>
            <p className="text-sm text-cocoa-500">
              Super admins are onboarded via email invitation with secure single-use password setup tokens.
            </p>
          </div>
          <Button
            onClick={() => {
              setInvitedResult(null);
              setInviteName("");
              setInviteEmail("");
              setShowInviteModal(true);
            }}
            className="flex items-center gap-2 self-start sm:self-auto shadow-sm"
          >
            <UserPlus size={16} />
            <span>Invite Super Admin</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Administrators" value={totalAdmins} icon={ShieldCheck} />
          <StatCard label="Active Accounts" value={activeAdmins} icon={CheckCircle2} />
          <StatCard label="Pending Invitation" value={pendingAdmins} icon={Clock} />
        </div>

        {/* Admins Table */}
        {admins.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No administrators found"
            description="Invite a super administrator to help manage the platform."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-cocoa-700">
                <thead className="border-b border-cream-200 bg-cream-50/70 text-xs uppercase font-semibold text-cocoa-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Administrator</th>
                    <th scope="col" className="px-6 py-4">Role</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Created</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-cocoa-900">{admin.name}</div>
                        <div className="text-xs text-cocoa-500">{admin.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-cocoa-600">
                        {admin.role}
                      </td>
                      <td className="px-6 py-4">
                        {admin.isPendingInvite ? (
                          <Badge tone="warning" className="flex items-center gap-1.5 w-fit">
                            <Clock size={12} />
                            <span>Pending Invite</span>
                          </Badge>
                        ) : (
                          <Badge tone="success" className="flex items-center gap-1.5 w-fit">
                            <CheckCircle2 size={12} />
                            <span>Active</span>
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-cocoa-500">
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {admin.isPendingInvite && (
                            <button
                              onClick={() => handleResend(admin)}
                              title="Resend invitation email"
                              className="inline-flex items-center gap-1 rounded-lg border border-cream-300 px-2.5 py-1 text-xs font-medium text-cocoa-600 hover:bg-cream-100 transition-colors"
                            >
                              <RefreshCw size={12} />
                              <span>Resend</span>
                            </button>
                          )}
                          {admin.id !== currentUserId && (
                            <button
                              onClick={() => handleRevoke(admin)}
                              title="Revoke administrator access"
                              className="rounded-lg p-1.5 text-cocoa-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-cream-300 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-cream-200 pb-4">
                <div className="flex items-center gap-2 text-cocoa-900 font-semibold">
                  <ShieldCheck size={20} className="text-terracotta-600" />
                  <span>Invite Super Administrator</span>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg p-1 text-cocoa-400 hover:bg-cream-100"
                >
                  <X size={18} />
                </button>
              </div>

              {invitedResult ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span>Invitation Dispatched!</span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-700">
                      An invitation email has been sent to <strong>{invitedResult.email}</strong>.
                      The administrator can use the link below to set their private password.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-cocoa-600">
                      Direct Password Setup Link (valid for 48 hours):
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-cream-300 bg-cream-50 p-2.5">
                      <input
                        readOnly
                        value={invitedResult.setupUrl}
                        className="flex-1 bg-transparent text-xs text-cocoa-800 outline-none font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(invitedResult.setupUrl)}
                        className="rounded-lg bg-white p-1.5 text-cocoa-600 border border-cream-300 hover:bg-cream-100"
                        title="Copy setup link"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={() => setShowInviteModal(false)}>Done</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-cocoa-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Kimani"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full rounded-xl border border-cream-300 px-3.5 py-2 text-sm outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-cocoa-700">
                      Email Address <span className="text-terracotta-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@crumbly.co.ke"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-cream-300 px-3.5 py-2 text-sm outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                    />
                  </div>

                  <div className="rounded-xl border border-cream-200 bg-cream-50/80 p-3 text-xs text-cocoa-600">
                    <p className="font-semibold text-cocoa-800 mb-0.5">Zero-Password Architecture</p>
                    <p>
                      Super administrators are invited with an empty/unusable password hash. No password is stored
                      in platform environment variables or plaintext. The invitee will receive an email link to set
                      their own secure credentials.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Sending Invitation..." : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "SUPER_ADMIN");
  if (guard.redirect) return guard;

  try {
    const admins = await backendFetch("/api/admin/admins", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    return {
      props: {
        initialAdmins: Array.isArray(admins) ? admins : [],
        currentUserId: guard.session.user?.id || null,
      },
    };
  } catch (err) {
    return {
      props: {
        initialAdmins: [],
        currentUserId: guard.session.user?.id || null,
      },
    };
  }
}
