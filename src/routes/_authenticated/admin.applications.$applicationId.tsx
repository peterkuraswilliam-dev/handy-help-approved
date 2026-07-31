import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/admin/applications/$applicationId",
)({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/admin/$id", params: { id: params.applicationId } });
  },
  component: () => null,
});
