export class RequestPayloadTooLargeError extends Error {
  public constructor(public readonly maxBytes: number) {
    super(`Request payload exceeds ${maxBytes} bytes.`);
    this.name = "RequestPayloadTooLargeError";
  }
}

function validateMaxBytes(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError("JSON request byte limit must be a positive safe integer.");
  }

  return value;
}

export async function readJsonBodyWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const limit = validateMaxBytes(maxBytes);
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null && /^\d+$/.test(contentLength)) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength > limit) {
      throw new RequestPayloadTooLargeError(limit);
    }
  }

  if (request.body === null) {
    throw new SyntaxError("JSON request body is required.");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined) continue;

      totalBytes += value.byteLength;
      if (totalBytes > limit) {
        await reader.cancel();
        throw new RequestPayloadTooLargeError(limit);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(text) as unknown;
}
