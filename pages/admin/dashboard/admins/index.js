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
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ADMIN_NAV } from "@/pages/admin/dashboard/index";
import StatCard from "@/components/dashboard/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

export default function AdminsManagement({ initialAdmins = [], currentUserId }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invitedResult, setInvitedResult] = useState(null);

  // Confirmation modal states
  const [resendAdmin, setResendAdmin] = useState(null);
  const [resending, setResending] = useState(false);
  const [revokeAdmin, setRevokeAdmin] = useState(null);
  const [revoking, setRevoking] = useState(false);

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

      setInvitedResult(data);
      if (data.emailSent) {
        toast.success(`Invitation email sent directly to ${inviteEmail}`);
      } else {
        toast.success(`Administrator created for ${inviteEmail}`);
      }

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

  async function handleConfirmResend() {
    if (!resendAdmin) return;
    setResending(true);
    try {
      const res = await fetch("/api/admin/admins/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resendAdmin.email,
          name: resendAdmin.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to resend invitation");
      }

      if (data.emailSent) {
        toast.success(`Invitation email sent directly to ${resendAdmin.email}'s inbox!`);
      } else {
        toast.success(`Invitation refreshed for ${resendAdmin.email}`);
      }
      setResendAdmin(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  }

  async function handleConfirmRevoke() {
    if (!revokeAdmin) return;
    if (revokeAdmin.id === currentUserId) {
      toast.error("You cannot revoke your own administrator account.");
      setRevokeAdmin(null);
      return;
    }

    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/admins/${revokeAdmin.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to revoke administrator");
      }

      setAdmins((prev) => prev.filter((a) => a.id !== revokeAdmin.id));
      toast.success(`Revoked access for ${revokeAdmin.email}`);
      setRevokeAdmin(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRevoking(false);
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
              Super admins are onboarded via automated email invitations sent directly to their inbox with secure activation tokens.
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
                              onClick={() => setResendAdmin(admin)}
                              title="Resend invitation email"
                              className="inline-flex items-center gap-1 rounded-lg border border-cream-300 px-2.5 py-1 text-xs font-medium text-cocoa-600 hover:bg-cream-100 transition-colors"
                            >
                              <RefreshCw size={12} />
                              <span>Resend</span>
                            </button>
                          )}
                          {admin.id !== currentUserId && (
                            <button
                              onClick={() => setRevokeAdmin(admin)}
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

        {/* Invite Super Admin Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => {
            if (!submitting) {
              setShowInviteModal(false);
              setInvitedResult(null);
            }
          }}
          tone={invitedResult ? (invitedResult.emailSent ? "success" : "warning") : "brand"}
          title={
            invitedResult
              ? (invitedResult.emailSent ? "Invitation Dispatched to Inbox" : "Administrator Created")
              : "Invite Super Administrator"
          }
          description={
            invitedResult
              ? (invitedResult.emailSent
                  ? `An automated invitation email has been sent directly to ${invitedResult.email}. They will receive it in their inbox to set up their private password.`
                  : `Administrator account created for ${invitedResult.email}. Automated email sending requires SMTP configuration in your backend environment.`)
              : "An invitation email will be sent directly to their inbox with a secure, 48-hour password setup link. No manual email or credential sharing is required."
          }
          primaryAction={
            invitedResult
              ? {
                  label: "Done",
                  onClick: () => {
                    setShowInviteModal(false);
                    setInvitedResult(null);
                  },
                }
              : undefined
          }
        >
          {invitedResult ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cream-200 bg-cream-50/70 p-4 text-xs text-cocoa-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cocoa-800">Invitee:</span>
                  <span className="text-cocoa-900">{invitedResult.name} ({invitedResult.email})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cocoa-800">Delivery Status:</span>
                  <span className={invitedResult.emailSent ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                    {invitedResult.emailSent ? "Delivered via SMTP to Inbox" : "SMTP Delivery Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cocoa-800">Token Validity:</span>
                  <span className="text-cocoa-600">48 hours</span>
                </div>
              </div>

              {invitedResult.emailSent ? (
                <p className="text-xs text-cocoa-500 leading-relaxed">
                  The recipient can now check their email inbox (and spam/promotions folder) to complete their setup. You do not need to send them a separate email.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="font-semibold">SMTP is not configured in backend .env</p>
                    <p className="mt-0.5 text-[11px] text-amber-700">
                      Configure <code>SMTP_HOST</code>, <code>SMTP_USER</code>, and <code>SMTP_PASSWORD</code> in your backend environment to deliver emails directly to inboxes.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-cocoa-600">
                      Manual Fallback Link:
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-cream-300 bg-cream-50 p-2">
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
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
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

              <div className="rounded-2xl border border-cream-200 bg-cream-50/80 p-3.5 text-xs text-cocoa-600">
                <p className="font-semibold text-cocoa-800 mb-0.5">Automated Inbox Onboarding</p>
                <p className="leading-relaxed">
                  The invited administrator will receive an email in their inbox with a one-time link to create their password. You do not need to share credentials or send a separate email.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending to Inbox..." : "Send Invitation to Inbox"}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Resend Confirmation Modal */}
        <Modal
          isOpen={Boolean(resendAdmin)}
          onClose={() => !resending && setResendAdmin(null)}
          tone="brand"
          title="Resend Invitation Email"
          description={`Are you sure you want to resend the setup invitation to ${resendAdmin?.name} (${resendAdmin?.email})? A fresh invitation email with setup instructions will be sent directly to their inbox.`}
          primaryAction={{
            label: resending ? "Sending..." : "Resend Email to Inbox",
            onClick: handleConfirmResend,
            loading: resending,
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => setResendAdmin(null),
          }}
        />

        {/* Revoke Confirmation Modal */}
        <Modal
          isOpen={Boolean(revokeAdmin)}
          onClose={() => !revoking && setRevokeAdmin(null)}
          tone="danger"
          title="Revoke Administrator Access"
          description={`Are you sure you want to revoke administrator access for ${revokeAdmin?.name} (${revokeAdmin?.email})? They will immediately lose access to all platform administrator features.`}
          primaryAction={{
            label: revoking ? "Revoking..." : "Revoke Access",
            variant: "danger",
            onClick: handleConfirmRevoke,
            loading: revoking,
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => setRevokeAdmin(null),
          }}
        />
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
