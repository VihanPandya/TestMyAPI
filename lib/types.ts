export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export function isHttpMethod(value: string): value is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(value);
}

/** A single editable row in the params / headers tables. */
export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type BodyMode = "none" | "json" | "text";

export type AuthMode = "none" | "bearer" | "basic";

export interface AuthState {
  mode: AuthMode;
  token: string;
  username: string;
  password: string;
}

/** The full state of the request the user is composing. */
export interface RequestState {
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  bodyMode: BodyMode;
  body: string;
  auth: AuthState;
}

/** Payload sent from the browser to our proxy route. */
export interface ProxyRequest {
  method: HttpMethod;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body: string | null;
}

/** Successful proxy result describing the upstream response. */
export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  body: string;
  timeMs: number;
  size: number;
  redirected: boolean;
  truncated: boolean;
}

/** Shape returned by the proxy route when the request could not be made. */
export interface ProxyError {
  error: string;
}

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  timeMs: number;
  createdAt: number;
  request: RequestState;
}
