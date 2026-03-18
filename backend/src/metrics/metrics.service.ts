import { Injectable } from '@nestjs/common';

type LabelSet = Record<string, string>;

type CounterSample = {
  labels: LabelSet;
  value: number;
};

type HistogramSample = {
  labels: LabelSet;
  count: number;
  sum: number;
  buckets: Map<number, number>;
};

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, CounterSample[]>();
  private readonly histograms = new Map<string, HistogramSample[]>();
  private readonly defaultBuckets = [
    0.005,
    0.01,
    0.025,
    0.05,
    0.1,
    0.25,
    0.5,
    1,
    2.5,
    5,
    10,
  ];

  incrementCounter(name: string, labels: LabelSet = {}, value = 1) {
    const samples = this.counters.get(name) ?? [];
    const sample = this.findCounterSample(samples, labels);

    sample.value += value;
    this.counters.set(name, samples);
  }

  observeHistogram(
    name: string,
    value: number,
    labels: LabelSet = {},
    buckets = this.defaultBuckets,
  ) {
    const samples = this.histograms.get(name) ?? [];
    const sample = this.findHistogramSample(samples, labels, buckets);

    sample.count += 1;
    sample.sum += value;

    for (const bucket of buckets) {
      if (value <= bucket) {
        sample.buckets.set(bucket, (sample.buckets.get(bucket) ?? 0) + 1);
      }
    }

    this.histograms.set(name, samples);
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
    const labels = {
      method,
      route,
      status_code: String(statusCode),
    };

    this.incrementCounter('mzc_http_requests_total', labels);
    this.observeHistogram('mzc_http_request_duration_seconds', durationSeconds, {
      method,
      route,
    });
  }

  recordBusinessEvent(operation: string, result: 'success' | 'failure') {
    this.incrementCounter('mzc_business_events_total', {
      operation,
      result,
    });
  }

  renderPrometheusMetrics() {
    const lines: string[] = [];

    lines.push('# HELP mzc_process_uptime_seconds Application uptime in seconds.');
    lines.push('# TYPE mzc_process_uptime_seconds gauge');
    lines.push(`mzc_process_uptime_seconds ${process.uptime()}`);

    lines.push('# HELP mzc_process_resident_memory_bytes Resident memory usage in bytes.');
    lines.push('# TYPE mzc_process_resident_memory_bytes gauge');
    lines.push(`mzc_process_resident_memory_bytes ${process.memoryUsage().rss}`);

    this.renderCounter(lines, 'mzc_http_requests_total', 'Total HTTP requests processed.');
    this.renderHistogram(
      lines,
      'mzc_http_request_duration_seconds',
      'HTTP request duration in seconds.',
    );
    this.renderCounter(
      lines,
      'mzc_business_events_total',
      'Business operation outcomes grouped by operation and result.',
    );

    return `${lines.join('\n')}\n`;
  }

  private renderCounter(lines: string[], name: string, help: string) {
    const samples = this.counters.get(name);

    if (!samples?.length) {
      return;
    }

    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} counter`);

    for (const sample of samples) {
      lines.push(`${name}${this.renderLabels(sample.labels)} ${sample.value}`);
    }
  }

  private renderHistogram(lines: string[], name: string, help: string) {
    const samples = this.histograms.get(name);

    if (!samples?.length) {
      return;
    }

    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} histogram`);

    for (const sample of samples) {
      const sortedBuckets = [...sample.buckets.entries()].sort(([left], [right]) => left - right);

      for (const [bucket, count] of sortedBuckets) {
        lines.push(
          `${name}_bucket${this.renderLabels({ ...sample.labels, le: String(bucket) })} ${count}`,
        );
      }

      lines.push(
        `${name}_bucket${this.renderLabels({ ...sample.labels, le: '+Inf' })} ${sample.count}`,
      );
      lines.push(`${name}_sum${this.renderLabels(sample.labels)} ${sample.sum}`);
      lines.push(`${name}_count${this.renderLabels(sample.labels)} ${sample.count}`);
    }
  }

  private renderLabels(labels: LabelSet) {
    const entries = Object.entries(labels);

    if (!entries.length) {
      return '';
    }

    const rendered = entries
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}="${this.escapeLabelValue(value)}"`)
      .join(',');

    return `{${rendered}}`;
  }

  private escapeLabelValue(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  private findCounterSample(samples: CounterSample[], labels: LabelSet) {
    const existing = samples.find((sample) => this.isSameLabels(sample.labels, labels));

    if (existing) {
      return existing;
    }

    const created: CounterSample = {
      labels: { ...labels },
      value: 0,
    };

    samples.push(created);
    return created;
  }

  private findHistogramSample(samples: HistogramSample[], labels: LabelSet, buckets: number[]) {
    const existing = samples.find((sample) => this.isSameLabels(sample.labels, labels));

    if (existing) {
      return existing;
    }

    const created: HistogramSample = {
      labels: { ...labels },
      count: 0,
      sum: 0,
      buckets: new Map(buckets.map((bucket) => [bucket, 0])),
    };

    samples.push(created);
    return created;
  }

  private isSameLabels(left: LabelSet, right: LabelSet) {
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);

    if (leftEntries.length !== rightEntries.length) {
      return false;
    }

    return leftEntries.every(([key, value]) => right[key] === value);
  }
}
