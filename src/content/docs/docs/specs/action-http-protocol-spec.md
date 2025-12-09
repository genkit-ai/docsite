# Genkit Action HTTP Protocol Specification

This document outlines the HTTP protocol used by Genkit for invoking Actions and Flows. The protocol supports both unary (request-response) and streaming interaction models.

## 1. Request Structure

All requests to Genkit actions (including Flows) use the HTTP `POST` method.

### URL
The URL typically corresponds to the resource name of the action or flow.
Example: `http://localhost:3400/myFlow`

### Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Required. Indicates the request body is JSON. |
| `Accept` | `text/event-stream` | Optional. Set this to request a **streaming** response. If omitted or set to `application/json`, a standard unary response is returned (unless `stream=true` query param is used). |

### Query Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `stream` | `true` | Optional. An alternative way to request streaming if the `Accept` header cannot be set. |

### Request Body

The request body must be a JSON object wrapping the input data.

```json
{
  "data": <INPUT_PAYLOAD>
}
```

*   **data**: The actual input argument expected by the flow/action schema.

---

## 2. Response: Unary (Non-Streaming)

Used when the client does not request streaming. The server waits for the action to complete and returns the final result.

### Status Codes
*   `200 OK`: Successful execution.
*   `400-599`: Error occurred (mapped from Genkit status codes).

### Headers
*   `Content-Type`: `application/json`
*   `x-genkit-trace-id`: The ID of the trace generated for this execution.
*   `x-genkit-span-id`: The ID of the span for this execution.

### Response Body (Success)

Returns a JSON object containing the result.

```json
{
  "result": <OUTPUT_PAYLOAD>
}
```

### Response Body (Error)

Returns a JSON object describing the error.

```json
{
  "code": <HTTP_STATUS_CODE>,
  "status": "<GENKIT_STATUS_STRING>",
  "message": "<ERROR_MESSAGE>",
  "details": <OPTIONAL_DETAILS_OBJECT>
}
```

---

## 3. Response: Streaming

Used when the client requests streaming (via `Accept: text/event-stream` or `stream=true`). The server sends partial results (chunks) as they are generated, followed by the final result.

### Status Codes
*   `200 OK`: Connection established successfully. Errors occurring during the stream are sent as error chunks.

### Headers
*   `Content-Type`: `text/plain` or `text/event-stream`
*   `Transfer-Encoding`: `chunked`

### Stream Format

The stream consists of a series of text blocks separated by a double newline delimiter (`\n\n`). Each block contains a prefix indicating the type of data, followed by a JSON payload.

**Delimiter**: `\n\n`

#### chunk Structure

```text
<PREFIX> <JSON_PAYLOAD>\n\n
```

*   **Prefix**:
    *   `data:` Used for successful chunks (messages and result).
    *   `error:` Used for error chunks.
*   **Payload**: A JSON object.

### Message Types

There are three types of payloads that can be delivered in the stream:

#### 1. Stream Message (Intermediate Chunk)
Sent whenever the action yields a chunk of data during execution.

```json
{
  "message": <STREAM_CHUNK_PAYLOAD>
}
```

#### 2. Stream Result (Completion)
Sent when the action completes successfully. This is typically the last message in the stream.

```json
{
  "result": <OUTPUT_PAYLOAD>
}
```

#### 3. Stream Error
Sent if an exception occurs during the streaming execution. Note that this chunk typically uses the `error:` prefix.

```json
{
  "error": {
    "status": "<GENKIT_STATUS_STRING>",
    "message": "<ERROR_MESSAGE>",
    "details": <OPTIONAL_DETAILS>
  }
}
```

### Example Stream

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Transfer-Encoding: chunked

data: {"message": "Hello"}\n\n
data: {"message": " world"}\n\n
data: {"result": "Hello world"}\n\n
```

### Example Stream (Error)

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Transfer-Encoding: chunked

data: {"message": "Processing..."}\n\n
error: {"error": {"status": "INTERNAL", "message": "Something went wrong"}}\n\n
```

## 4. Error Mapping

Standard HTTP status codes are mapped from Genkit internal statuses:

| Genkit Status | HTTP Status |
|---------------|-------------|
| INVALID_ARGUMENT | 400 |
| FAILED_PRECONDITION | 400 |
| OUT_OF_RANGE | 400 |
| UNAUTHENTICATED | 401 |
| PERMISSION_DENIED | 403 |
| NOT_FOUND | 404 |
| ALREADY_EXISTS | 409 |
| ABORTED | 409 |
| RESOURCE_EXHAUSTED | 429 |
| CANCELLED | 499 |
| UNAVAILABLE | 503 |
| DATA_LOSS | 500 |
| UNKNOWN | 500 |
| INTERNAL | 500 |
| UNIMPLEMENTED | 501 |
| DEADLINE_EXCEEDED | 504 |
