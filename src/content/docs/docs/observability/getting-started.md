---
title: Get started with Genkit Monitoring
description: This quickstart guide explains how to set up Genkit Monitoring for your deployed Genkit features to collect and view real-time telemetry data, including metrics, traces, and production trace exports for evaluations.
---

This quickstart guide describes how to set up Genkit Monitoring for
your deployed Genkit features, so that you can collect and view real-time
telemetry data. With Genkit Monitoring, you get visibility into how
your Genkit features are performing in production.

Key capabilities of Genkit Monitoring include:

- Viewing quantitative metrics like Genkit feature latency, errors, and
  token usage.
- Inspecting traces to see your Genkit's feature steps, inputs, and outputs,
  to help with debugging and quality improvement.
- Exporting production traces to run evals within Genkit.

Setting up Genkit Monitoring requires completing tasks in both your codebase
and on the Google Cloud Console.

## Before you begin

1. If you haven't already, create a Firebase project.

   In the [Firebase console](https://console.firebase.google.com), click
   **Add a project**, then follow the on-screen instructions. You can
   create a new project or add Firebase services to an already-existing Google Cloud project.

2. Ensure your project is on the
   [Blaze pricing plan](https://firebase.google.com/pricing).

   Genkit Monitoring relies on telemetry data written to Google Cloud
   Logging, Metrics, and Trace, which are paid services. View the
   [Google Cloud Observability pricing](https://cloud.google.com/stackdriver/pricing) page for pricing details and to learn about free-of-charge tier limits.

3. Write a Genkit feature by following the [Get Started Guide](/docs/get-started), and prepare your code for deployment by using one of the following guides:

   a. [Deploy flows using Cloud Functions for Firebase](/docs/firebase)
   b. [Deploy flows using Cloud Run](/docs/cloud-run)
   c. [Deploy flows to any Node.js platform](/docs/deploy-node)

## Step 1. Add the Firebase plugin

Install the `@genkit-ai/firebase` plugin in your project:

```bash
npm install @genkit-ai/firebase
```

### Environment-based configuration

If you intend to use the default configuration for Firebase Genkit
Monitoring, you can enable telemetry by setting the
`ENABLE_FIREBASE_MONITORING` environment variable in your deployment
environment.

```bash
export ENABLE_FIREBASE_MONITORING=true
```

:::note
This will use default configuration values. To
override configuration options, use "Programmatic configuration".
:::

### Programmatic configuration

You can also enable Firebase Genkit Monitoring in code. This is useful
if you want to tweak any configuration settings like the metric export
interval or to set up your local environment to export telemetry data.

Import `enableFirebaseTelemetry` into your Genkit configuration file (the
file where `genkit(...)` is initalized), and call it:

```typescript
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';

enableFirebaseTelemetry();
```

## Step 2. Enable the required APIs

Make sure that the following APIs are enabled for your Google Cloud project:

- [Cloud Logging API](https://console.cloud.google.com/apis/library/logging.googleapis.com)
- [Cloud Trace API](https://console.cloud.google.com/apis/library/cloudtrace.googleapis.com)
- [Cloud Monitoring API](https://console.cloud.google.com/apis/library/monitoring.googleapis.com)

These APIs should be listed in the
[API dashboard](https://console.cloud.google.com/apis/dashboard) for your
project.

## Step 3. Set up permissions

The Firebase plugin needs to use a _service account_ to authenticate with
Google Cloud Logging, Metrics, and Trace services.

Grant the following roles to whichever service account is configured to run your code within the [Google Cloud IAM Console](https://console.cloud.google.com/iam-admin/iam). For Cloud Functions for Firebase and Cloud Run, that's typically the default compute service account.

- **Monitoring Metric Writer** (`roles/monitoring.metricWriter`)
- **Cloud Trace Agent** (`roles/cloudtrace.agent`)
- **Logs Writer** (`roles/logging.logWriter`)

## Step 4. (Optional) Test your configuration locally

Before deploying, you can run your Genkit code locally to confirm that
telemetry data is being collected, and is viewable in the Genkit Monitoring
dashboard.

1. In your Genkit code, set `forceDevExport` to `true` to send telemetry from
   your local environment.

2. Use your service account to authenticate and test your configuration.

   :::tip
   In order to impersonate the service account, you will need to have
   the `roles/iam.serviceAccountTokenCreator`
   [IAM role](https://console.cloud.google.com/iam-admin/iam) applied to your
   user account.
   :::

   With the
   [Google Cloud CLI tool](https://cloud.google.com/sdk/docs/install?authuser=0),
   authenticate using the service account:

   ```bash
   gcloud auth application-default login --impersonate-service-account SERVICE_ACCT_EMAIL
   ```

3. Run and invoke your Genkit feature, and then view metrics on the
   [Genkit Monitoring dashboard](https://console.firebase.google.com/project/_/genai_monitoring).
   Allow for up to 5 minutes to collect the first metric. You can reduce this
   delay by setting `metricExportIntervalMillis` in the telemetry configuration.

4. If metrics are not appearing in the Genkit Monitoring dashboard, view the
   [Troubleshooting](/docs/observability/troubleshooting) guide for steps
   to debug.

## Step 5. Re-build and deploy code

Re-build, deploy, and invoke your Genkit feature to start collecting data.
After Genkit Monitoring receives your metrics, you can view them by
visiting the
[Genkit Monitoring dashboard](https://console.firebase.google.com/project/_/genai_monitoring)

:::note
It may take up to 5 minutes to collect the first metric (based on the default `metricExportIntervalMillis` setting in the telemetry configuration).
:::
