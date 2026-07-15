import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  loader: () => {
    throw redirect({ to: "/gioi-thieu", statusCode: 301 });
  },
  component: () => null,
  notFoundComponent: () => null,
  errorComponent: () => null,
});