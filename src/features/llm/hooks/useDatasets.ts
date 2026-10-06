import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useStandardQuery } from "@shared/hooks/useStandardQuery";

import {
  type DatasetItemInput,
  type RunExperimentRequest,
  addDatasetItems,
  createDataset,
  deleteDataset,
  getDataset,
  listDatasets,
  runExperiment,
} from "../api/datasetsApi";

const LIST_KEY = ["llm", "datasets", "list"];

export function useDatasets() {
  return useStandardQuery({ queryKey: LIST_KEY, queryFn: listDatasets });
}

export function useDataset(id: number | null) {
  return useStandardQuery({
    queryKey: ["llm", "datasets", "detail", id],
    queryFn: () => getDataset(id ?? 0),
    enabled: id != null && id > 0,
    refetchInterval: (query) =>
      query.state.data?.runs.some((run) => run.status === "running") ? 2_000 : false,
  });
}

export function useDatasetMutations(id?: number) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: LIST_KEY });
    if (id) void queryClient.invalidateQueries({ queryKey: ["llm", "datasets", "detail", id] });
  };
  const create = useMutation({
    mutationFn: (args: { name: string; description?: string }) =>
      createDataset(args.name, args.description),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (datasetId: number) => deleteDataset(datasetId),
    onSuccess: invalidate,
  });
  const addItems = useMutation({
    mutationFn: (items: DatasetItemInput[]) => addDatasetItems(id ?? 0, items),
    onSuccess: invalidate,
  });
  const run = useMutation({
    mutationFn: (req: RunExperimentRequest) => runExperiment(id ?? 0, req),
    onSuccess: invalidate,
  });
  return { create, remove, addItems, run };
}
