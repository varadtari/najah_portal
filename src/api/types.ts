// Types mirror the essl_integration_service models. Money is integer paise; dates are
// YYYY-MM-DD calendar days in the gym's timezone.

export type Role = 'superadmin' | 'owner' | 'staff'

export type Me = {
  userId: number
  name: string
  email: string
  role: Role
  gymId: number | null
  gymName: string | null
}
