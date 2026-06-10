import type { HttpMethod } from "./types";

/** Tailwind text-color utility for an HTTP method, used for the method badges. */
export function methodColor(method: HttpMethod): string {
  switch (method) {
    case "GET":
      return "text-success";
    case "POST":
      return "text-warning";
    case "PUT":
      return "text-info";
    case "PATCH":
      return "text-magenta";
    case "DELETE":
      return "text-danger";
    default:
      return "text-muted";
  }
}
