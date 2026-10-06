import { errorMessage } from "@shared/api/utils/errorNormalization";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { PageShell } from "@shared/components/ui/layout/PageShell";

import { ackMonitor, muteMonitor, unmuteMonitor } from "../../api/monitorsApi";
import { DEFAULT_MUTE_SECONDS } from "../../constants";
import {
  useMonitorDetail,
  useMonitorEventsQuery,
  useMonitorSeriesQuery,
  useStatusTimelineQuery,
} from "../../hooks/useMonitorDetail";
import { useDeleteMonitor } from "../../hooks/useMonitorMutations";

import CurrentValueCard from "./CurrentValueCard";
import DetailHeader from "./DetailHeader";
import EvalChartCard from "./EvalChartCard";
import NotificationsCard from "./NotificationsCard";
import QueryCard from "./QueryCard";
import RecentTriggersCard from "./RecentTriggersCard";
import RunbookCard from "./RunbookCard";
import StatusTimelineCard from "./StatusTimelineCard";

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function MonitorDetailPage() {
  const params = useParams({ strict: false }) as { monitorId?: string };
  const id = params.monitorId ? Number(params.monitorId) : undefined;
  const navigate = useNavigate();

  const detailQ = useMonitorDetail(id);
  const seriesQ = useMonitorSeriesQuery(id, ONE_HOUR_MS);
  const timelineQ = useStatusTimelineQuery(id, ONE_DAY_MS);
  const eventsQ = useMonitorEventsQuery(id, 10);
  const deleteMutation = useDeleteMonitor();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAck = useCallback(async () => {
    if (id === undefined) return;
    setActionError(null);
    try {
      await ackMonitor(id);
      detailQ.refetch();
      eventsQ.refetch();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }, [id, detailQ, eventsQ]);

  const handleMute = useCallback(
    async (muted: boolean) => {
      if (id === undefined) return;
      setActionError(null);
      try {
        await (muted ? unmuteMonitor(id) : muteMonitor(id, DEFAULT_MUTE_SECONDS));
        detailQ.refetch();
      } catch (err) {
        setActionError(errorMessage(err));
      }
    },
    [id, detailQ]
  );

  const handleEdit = useCallback(() => {
    if (id === undefined) return;
    navigate({ to: `/monitors/${id}/edit` as string & {} });
  }, [id, navigate]);

  const handleDelete = useCallback(async () => {
    if (id === undefined) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
      navigate({ to: "/monitors" });
    } catch (err) {
      setDeleteError(errorMessage(err));
    }
  }, [id, deleteMutation, navigate]);

  if (id === undefined || Number.isNaN(id)) {
    return (
      <PageShell>
        <div className="p-8 text-foreground-muted text-sm">
          Invalid monitor id.{" "}
          <button
            type="button"
            onClick={() => navigate({ to: "/monitors" })}
            className="text-primary underline"
          >
            Back to monitors
          </button>
        </div>
      </PageShell>
    );
  }

  if (detailQ.isPending) {
    return (
      <PageShell>
        <div className="p-8 text-foreground-muted text-sm">Loading monitor…</div>
      </PageShell>
    );
  }

  if (detailQ.isError) {
    return (
      <PageShell>
        <div className="p-8 text-error text-sm">
          Failed to load monitor.{" "}
          <button
            type="button"
            onClick={() => detailQ.refetch()}
            className="text-primary underline"
          >
            Retry
          </button>
        </div>
      </PageShell>
    );
  }

  const monitor = detailQ.data;

  return (
    <PageShell>
      <DetailHeader
        monitor={monitor}
        onAck={handleAck}
        onMute={handleMute}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleting={deleteMutation.isPending}
        deleteError={deleteError}
      />

      {actionError && (
        <div className="rounded border border-error bg-error/10 px-4 py-2 text-error text-sm">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4">
        <EvalChartCard data={seriesQ.data} loading={seriesQ.isPending} />
        <CurrentValueCard monitor={monitor} />
        <StatusTimelineCard data={timelineQ.data} />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <QueryCard monitor={monitor} />
          <RecentTriggersCard events={eventsQ.data ?? []} loading={eventsQ.isPending} />
        </div>
        <div className="flex flex-col gap-4">
          <NotificationsCard monitor={monitor} />
          <RunbookCard monitor={monitor} />
        </div>
      </div>
    </PageShell>
  );
}
