"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SimpleCaptchaProps {
  onVerify: (token: string) => void
}

export function SimpleCaptcha({ onVerify }: SimpleCaptchaProps) {
  const [captchaText, setCaptchaText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [isVerified, setIsVerified] = useState(false)

  // Generate a simple captcha
  const generateCaptcha = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
    setUserInput("")
    setIsVerified(false)
  }, [])

  // Initialize captcha on component mount
  useEffect(() => {
    generateCaptcha()
  }, [generateCaptcha])

  // Check if input matches captcha text
  const checkCaptcha = useCallback(() => {
    if (userInput && userInput === captchaText && !isVerified) {
      setIsVerified(true)
      // Generate a simple token
      const token = btoa(`verified_${Date.now()}`)
      onVerify(token)
    }
  }, [userInput, captchaText, isVerified, onVerify])

  // Only check when userInput changes
  useEffect(() => {
    checkCaptcha()
  }, [userInput, checkCaptcha])

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">Captcha Verification</Label>
      <div className="flex items-center gap-2">
        <div className="bg-muted p-2 rounded-md font-mono text-lg tracking-wider select-none">{captchaText}</div>
        <Button type="button" variant="ghost" size="icon" onClick={generateCaptcha}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        id="captcha"
        type="text"
        placeholder="Enter the text above"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className={isVerified ? "border-green-500" : ""}
      />
      <p className="text-xs text-muted-foreground">
        {isVerified ? "✓ Verified" : "Please enter the characters shown above"}
      </p>
    </div>
  )
}
