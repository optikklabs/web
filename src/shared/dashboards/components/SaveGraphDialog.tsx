import { useNavigate } from "@tanstack/react-router";
import { FolderPlus, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@shared/components/primitives/ui/button";
import { Modal } from "@shared/components/primitives/ui/dialog";
import {
  type CreateDashboardPagePayload,
  type DashboardPage,
  createDashboardPage,
  createWidget,
} from "@shared/dashboards/api/dashboardsApi";
import { editorStateToPayload } from "@shared/dashboards/builder/metricsWidget";
import { useDashboardPagesList } from "@shared/dashboards/hooks/useDashboardPages";
import type {
  FormulaDefinition,
  MetricQueryDefinition,
  MetricSpaceAggregation,
  TimeStep,
} from "@shared/metrics/types";

interface SaveGraphDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly queries: MetricQueryDefinition[];
  readonly formulas: FormulaDefinition[];
  readonly step: TimeStep;
  readonly spaceAgg: MetricSpaceAggregation;
}

export function SaveGraphDialog({
  open,
  onClose,
  queries,
  formulas,
  step,
  spaceAgg,
}: SaveGraphDialogProps) {
  const navigate = useNavigate();
  const { data } = useDashboardPagesList({ limit: 50 });
  const pages = data?.items ?? [];

  const [selectedPageId, setSelectedPageId] = useState<number | "new">("new");
  const [newPageName, setNewPageName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let targetPageId: number;

      if (selectedPageId === "new") {
        const title = newPageName.trim() || queries[0]?.metricName || "Saved Graph";
        const pagePayload: CreateDashboardPagePayload = {
          name: title,
          icon: "layout-dashboard",
          iconColor: "var(--color-primary)",
        };
        const page = await createDashboardPage(pagePayload);
        targetPageId = page.id;
      } else {
        targetPageId = selectedPageId;
      }

      const widgetPayload = editorStateToPayload(
        {
          title: queries[0]?.metricName || "Saved Graph",
          viz: "timeseries",
          queries,
          formulas,
          step,
          spaceAgg,
          display: { legend: true, smooth: true },
          size: "md",
        },
        0
      );

      await createWidget(targetPageId, widgetPayload);
      toast.success("Graph saved to dashboard");
      onClose();
      navigate({ to: "/dashboards/$pageId", params: { pageId: String(targetPageId) } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save graph");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Save Graph to Dashboard"
      width={520}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            Save
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Create new page option */}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="dashboard-page"
            checked={selectedPageId === "new"}
            onChange={() => setSelectedPageId("new")}
            className="accent-primary"
          />
          <FolderPlus size={16} className="shrink-0 text-foreground-secondary" />
          <span className="text-sm">Create new page</span>
        </label>

        {selectedPageId === "new" && (
          <input
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            placeholder="Dashboard page name"
            className="rounded border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
        )}

        {/* Existing pages */}
        {pages.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-foreground-muted text-xs">Or add to an existing page</span>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {pages.map((page: DashboardPage) => (
                <label
                  key={page.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="dashboard-page"
                    checked={selectedPageId === page.id}
                    onChange={() => setSelectedPageId(page.id)}
                    className="accent-primary"
                  />
                  <LayoutDashboard size={14} className="shrink-0 text-foreground-secondary" />
                  <div className="flex flex-col">
                    <span className="text-sm">{page.name}</span>
                    <span className="text-[11px] text-foreground-muted">
                      {page.widgetCount} widget{page.widgetCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
