import { createFileRoute } from "@tanstack/react-router";

export interface DatabaseQuerySearch {
  readonly dbSystem?: string;
  readonly collection?: string;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export const Route = createFileRoute("/_app/database/query/$queryId")({
  validateSearch: (search: Record<string, unknown>): DatabaseQuerySearch => ({
    dbSystem: optionalString(search.dbSystem),
    collection: optionalString(search.collection),
  }),
});
