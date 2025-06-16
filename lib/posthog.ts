import { PostHog } from "posthog-node"

export default function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // @ts-expect-error
    capture_pageview: 'history_change',
    flushAt: 1,
    flushInterval: 0,
  })

  return posthogClient
}