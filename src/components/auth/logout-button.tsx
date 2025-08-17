'use client'

import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit">Logout</Button>
    </form>
  )
}
