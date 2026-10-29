export function serializeJson(data: any): string {
  return JSON.stringify(data || {});
}

export function parseJson(str: string): any {
  try {
    return JSON.parse(str || '{}');
  } catch {
    return {};
  }
}
