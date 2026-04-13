let _token: string | undefined;

export function setReadAccessToken(token: string): void {
  _token = token;
}

export function getReadAccessToken(): string | undefined {
  return _token;
}
