---
title: Genkit Monitoring - Troubleshooting
description: This guide provides solutions to common issues encountered when using Genkit Monitoring, including problems with traces, metrics, and telemetry export.
---

The following sections detail solutions to common issues that developers run
into when using Genkit Monitoring.

## I can't see traces or metrics in Genkit Monitoring

1.  Ensure that the following APIs are enabled for your underlying Google Cloud project:
    - [Cloud Logging API](https://console.cloud.google.com/apis/library/logging.googleapis.com)
    - [Cloud Trace API](https://console.cloud.google.com/apis/library/cloudtrace.googleapis.com)
    - [Cloud Monitoring API](https://console.cloud.google.com/apis/library/monitoring.googleapis.com)
2.  Ensure that the following roles are applied to the service account that is running your code (or service account that has been configured as part of the plugin options) in [Cloud IAM](https://console.cloud.google.com/iam-admin/iam).
    - **Monitoring Metric Writer** (`roles/monitoring.metricWriter`)
    - **Cloud Trace Agent** (`roles/cloudtrace.agent`)
    - **Logs Writer** (`roles/logging.logWriter`)
3.  Inspect the application logs for errors writing to Cloud Logging, Cloud Trace, and Cloud Monitoring. On Google Cloud infrastructure such as Firebase Functions and Cloud Run, even when telemetry is misconfigured, logs to `stdout/stderr` are automatically ingested by the Cloud Logging Agent, allowing you to diagnose issues in the in the [Cloud Logging Console](https://console.cloud.google.com/logs).

4.  Debug locally:

    Enable dev export:

    ```typescript
    enableFirebaseTelemetry({
      forceDevExport: true,
    });
    ```

    To test with your personal user credentials, use the
    [gcloud CLI](https://cloud.google.com/sdk/docs/install) to authenticate with
    Google Cloud. Doing so can help diagnose enabled or disabled APIs, but does
    not test the gcloud auth application-default login.

    Alternatively, impersonating the service account lets you test
    production-like access. You must have the
    `roles/iam. serviceAccountTokenCreator` IAM role applied to your user account
    in order to impersonate service accounts:

    ```bash
    gcloud auth application-default login --impersonate-service-account <SERVICE_ACCT_EMAIL>
    ```

    See the
    [ADC](https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment)
    documentation for more information.

## Request count does not match traces count

At low volumes (<1 query per second), you may notice that your metric counts,
like requests or failed paths, do not match the number of traces shown in the
traces table. Below are three common reasons for this happening.

### Metric and trace export intervals can be different

In some cases, the dashboard shows traces that have exported but metrics that
have not, or vice versa.

You can reduce the likelihood of this happening by adjusting the metric export
interval to be more frequent. By default, metrics are exported every 5 minutes.
The minimum allowable export interval is 5 seconds.

:::note
Exporting metrics more frequently can result in increased costs.
:::

```typescript
enableFirebaseTelemetry({
  // Override the export interval to 3 minutes
  metricExportIntervalMillis: 180_000,
  // Override the export timeout to 3 minutes
  metricExportTimeoutMillis: 180_000,
});
```

### Intermittent network issues

Occasionally you may have transient network issues that result in a failure to
upload telemetry data. These failures are logged to Google Cloud Logging. To
see the specific failure reason, look for a log that starts with --

> Unable to send telemetry to Google Cloud: Error: Send TimeSeries failed:

### Telemetry upload reliability in Firebase Functions or Cloud Run

When your Genkit codei is hosted in Google Cloud Run or Cloud Functions for
Firebase, telemetry-data upload may be less reliable as the container switches
to the "idle"
[lifecycle state](https://cloud.google.com/blog/topics/developers-practitioners/lifecycle-container-cloud-run).
If higher reliability is important to you, consider changing
[CPU allocation](https://cloud.google.com/run/docs/configuring/cpu-allocation)
to **Instance-based billing** (previously called **CPU always allocated**) in the Google Cloud Console.

:::note
The **Instance-based billing** setting impacts pricing. Check [Cloud Run pricing](https://cloud.google.com/run/pricing) before enabling this setting.
:::

To switch to instance-based billing, run

```bash
gcloud run services update YOUR-SERVICE --no-cpu-throttling
```
