import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = { title: "Sign in" }

/**
 * The desk's gate. Rendered outside the shell — there is no sidebar to show
 * someone who is not through the door yet.
 */
export default function LoginPage() {
  return (
    <div className="grid min-h-svh place-items-center bg-background grid-texture p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-3 text-center">
          <span
            className="grid size-9 place-items-center rounded-[4px] border-[1.5px] border-primary font-sans text-[15px] font-extrabold text-primary"
            style={{ boxShadow: "0 0 16px -4px var(--primary)" }}
          >
            N
          </span>
          <div>
            <CardTitle className="font-sans text-[15px] font-extrabold tracking-[0.16em]">
              NEO
            </CardTitle>
            <CardDescription className="text-[10px] tracking-[0.22em] text-faint">
              TRADING DESK
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action="/login" method="post">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">Desk password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                />
              </Field>
              <Button type="submit" className="w-full">
                Enter
              </Button>
            </FieldGroup>
          </form>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
            One app · one port. The session cookie is set by the aiohttp app;
            this page only collects the password.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
