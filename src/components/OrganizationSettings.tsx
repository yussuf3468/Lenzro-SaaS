import React, { useState } from "react";
import { useSaaS } from "../contexts/SaaSContext";
import {
  Building2,
  Users,
  Settings,
  Crown,
  Mail,
  UserPlus,
  Trash2,
  Shield,
  ChevronDown,
} from "lucide-react";
import type { OrganizationRole } from "../types/saas.types";

export default function OrganizationSettings() {
  const {
    currentOrganization,
    organizations,
    members,
    switchOrganization,
    updateOrganization,
    inviteMember,
    removeMember,
    updateMemberRole,
  } = useSaaS();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("member");
  const [orgName, setOrgName] = useState(currentOrganization?.name || "");
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const handleUpdateOrganization = async () => {
    if (!orgName.trim()) return;

    try {
      await updateOrganization({ name: orgName });
      alert("Organization updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update organization");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await inviteMember({ email: inviteEmail, role: inviteRole });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("member");
      alert("Invitation sent! (Email integration coming in Phase 6)");
    } catch (error) {
      console.error("Invite error:", error);
      alert("Failed to send invitation");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMember(memberId);
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove member");
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: OrganizationRole
  ) => {
    try {
      await updateMemberRole({ member_id: memberId, role: newRole });
    } catch (error) {
      console.error("Role update error:", error);
      alert("Failed to update role");
    }
  };

  const getRoleBadgeColor = (role: OrganizationRole) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      case "manager":
        return "bg-green-100 text-green-700";
      case "staff":
        return "bg-gray-100 text-gray-700";
      case "viewer":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Organization Selector */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-600" />
              Organization Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your organization and team members
            </p>
          </div>

          {/* Organization Switcher */}
          {organizations.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{currentOrganization?.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showOrgDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setShowOrgDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                        org.id === currentOrganization?.id
                          ? "bg-indigo-50 text-indigo-700"
                          : ""
                      }`}
                    >
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {org.subscription_tier} Plan
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Organization Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">
            Organization Details
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter organization name"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={currentOrganization?.slug || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Tier
              </label>
              <input
                type="text"
                value={currentOrganization?.subscription_tier || "free"}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
              />
            </div>
          </div>

          <button
            onClick={handleUpdateOrganization}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {members.length} / {currentOrganization?.max_users}
            </span>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            Invite Member
          </button>
        </div>

        {/* Members List */}
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold text-lg">
                    {member.user?.full_name?.[0] ||
                      member.user?.email?.[0] ||
                      "?"}
                  </span>
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {member.user?.full_name || "No name"}
                  </p>
                  <p className="text-sm text-gray-600">{member.user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Role Badge */}
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${getRoleBadgeColor(
                    member.role
                  )}`}
                >
                  {getRoleIcon(member.role)}
                  <span className="text-sm font-medium capitalize">
                    {member.role}
                  </span>
                </div>

                {/* Role Selector (for admins) */}
                {member.role !== "owner" && (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleUpdateRole(
                        member.id,
                        e.target.value as OrganizationRole
                      )
                    }
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}

                {/* Remove Button (only for non-owners) */}
                {member.role !== "owner" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet. Invite your first member!</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-8 h-8 text-indigo-600" />
              <h3 className="text-2xl font-bold text-gray-900">
                Invite Team Member
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              Send an invitation to add a new member to your organization.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as OrganizationRole)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="admin">Admin - Full access</option>
                  <option value="manager">
                    Manager - Manage team & operations
                  </option>
                  <option value="staff">Staff - Standard access</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                className="flex-1 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
              >
                Send Invite
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Email integration coming in Phase 6
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
