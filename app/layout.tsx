import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/notifications/toast-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { getCurrentUser } from "@/lib/auth/hooks"
import { getFilteredApplications } from "@/lib/data/dashboard"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Ansar DF - Applicant Tracking Portal",
  description: "Digital financing application tracking system",
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
    const user = await getCurrentUser();
    const data = getFilteredApplications(user?.role, user?.id)
    console.log(data)
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider user={user}>
          <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
      </body>
    </html>
  )
}
