import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/genres")({
  loader: () => {
    throw redirect({ to: "/the-loai", statusCode: 301 });
  },
  component: () => null,
  notFoundComponent: () => null,
  errorComponent: () => null,
});