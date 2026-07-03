"use client";

import AppErrorState from "@/components/AppErrorState";

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <AppErrorState {...props} area="problems" />;
}
