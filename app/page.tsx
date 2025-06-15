"use client"

import SlidingPuzzleCaptcha from "../sliding-puzzle-captcha"

export default function Page() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-24 py-5 px-24"
      style={{
        backgroundImage: "url(/noisy-gradient-bg.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <SlidingPuzzleCaptcha />
    </main>
  )
}
