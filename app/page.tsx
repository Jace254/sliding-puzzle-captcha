"use client"

import SlidingPuzzleCaptcha from "../components/sliding-puzzle-captcha"
import { Github } from "lucide-react"

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
      <div className="absolute top-5 right-5">
        <a href="https://github.com/Jace254/sliding-puzzle-captcha" target="_blank" className="z-1000 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90
        h-10 px-4 py-2">
        <Github className="w-4 h-4 mr-2" />
        Github
        </a>
      </div>
      <SlidingPuzzleCaptcha />
    </main>
  )
}
