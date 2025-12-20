import React from "react";
import {
  init,
  reactRouterV6BrowserTracingIntegration,
  replayIntegration,
} from "@sentry/react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENV || import.meta.env.MODE,
    integrations: [
      reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
        tracePropagationTargets: [
          /^https?:\/\/(localhost|127\.0\.0\.1|81\.22\.134\.84)/,
        ],
      }),
      replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? 0),
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? 1),
    autoSessionTracking: true,
  });
}
