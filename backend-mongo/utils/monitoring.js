import client from "prom-client";

// Create a Registry which can register the metrics
const register = new client.Registry();

// Add a default set of metrics
client.collectDefaultMetrics({ register });

// Create a histogram for request duration
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 5, 15, 50, 100, 200, 500, 1000, 2000, 5000],
});

register.registerMetric(httpRequestDurationMicroseconds);

export const getMetrics = async () => {
  return await register.metrics();
};

export const getContentType = () => {
  return register.contentType;
};
