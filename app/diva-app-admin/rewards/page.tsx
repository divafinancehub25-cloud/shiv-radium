import { adminGetRewardRules, adminGetUserRewards } from "@/actions/diva/rewards";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Gift, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { CreateRewardRuleForm } from "@/components/diva/admin/create-reward-rule-form";
import { ToggleRewardRuleBtn } from "@/components/diva/admin/toggle-reward-rule-btn";

const rewardTypeColor: Record<string, string> = {
  POINTS: "text-[#D4AF37] bg-[#D4AF37]/10",
  BADGE: "text-purple-400 bg-purple-400/10",
  CREDIT: "text-emerald-400 bg-emerald-400/10",
  TIER_ADVANCEMENT: "text-blue-400 bg-blue-400/10",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminRewardsPage() {
  const [rulesRes, rewardsRes] = await Promise.all([
    adminGetRewardRules(),
    adminGetUserRewards(),
  ]);

  const rules = "data" in rulesRes ? (rulesRes.data ?? []) : [];
  const rewards = "data" in rewardsRes ? (rewardsRes.data ?? []) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rewards Engine</h1>
        <p className="text-sm text-white/40 mt-1">Configure reward rules and manage user rewards on STICKO</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reward Rules */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Reward Rules</h2>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-lg">{rules.length} rules</span>
            </div>
            {rules.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-6">No rules yet — create one below</p>
            ) : (
              <div className="space-y-3">
                {rules.map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white text-sm font-medium truncate">{r.ruleName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rewardTypeColor[r.rewardType] ?? "text-white/40 bg-white/5"}`}>
                          {r.rewardType}
                        </span>
                      </div>
                      {r.description && <p className="text-white/40 text-xs mb-1">{r.description}</p>}
                      <p className="text-white/30 text-[10px]">Trigger: {r.triggerEvent} · Value: {r.rewardValue}</p>
                    </div>
                    <ToggleRewardRuleBtn id={r.id} isActive={r.isActive} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Create Rule Form */}
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#D4AF37]" /> Create Reward Rule
            </h2>
            <CreateRewardRuleForm />
          </GlassCard>
        </div>

        {/* Recent Rewards */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Recent Rewards Granted</h2>
          {rewards.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No rewards granted yet</p>
          ) : (
            <div className="overflow-y-auto max-h-[600px] space-y-0 divide-y divide-white/[0.04]">
              {rewards.map((r: any) => (
                <div key={r.id} className="py-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/10 shrink-0">
                    <Gift className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{r.rewardName}</p>
                    <p className="text-white/30 text-[10px] truncate">{r.userName} · {r.userEmail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#D4AF37] text-xs font-bold">{r.rewardValue}</p>
                    <p className="text-white/20 text-[10px]">{fmtDate(r.awardedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
