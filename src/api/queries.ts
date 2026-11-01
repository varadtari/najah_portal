import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { CheckinPage, DashboardSummary, Device, DeviceCommand, DeviceCommandKind, Gym, Member, MemberDetail, PaymentMethod, Plan, Verdict } from './types'

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  gym: ['gym'] as const,
  plans: ['plans'] as const,
  members: (search: string) => ['members', { search }] as const,
  overdue: ['overdue'] as const,
  member: (id: number) => ['member', id] as const,
  devices: ['devices'] as const,
  deviceCommands: (id: number) => ['device-commands', id] as const,
  checkins: (filter: CheckinFilter) => ['checkins', filter] as const,
}

export function useDashboard(enabled = true) {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api<DashboardSummary>('/v1/dashboard/summary'), enabled })
}

export function useGym() {
  return useQuery({ queryKey: queryKeys.gym, queryFn: () => api<Gym>('/v1/gym'), staleTime: 10 * 60_000 })
}

export function usePlans() {
  return useQuery({ queryKey: queryKeys.plans, queryFn: () => api<Plan[]>('/v1/plans'), staleTime: 10 * 60_000 })
}

export function useMembers(search: string) {
  return useQuery({
    queryKey: queryKeys.members(search),
    queryFn: ({ signal }) => api<Member[]>(`/v1/members?search=${encodeURIComponent(search)}`, { signal }),
    // Keep the current list on screen while the next search loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  })
}

export function useOverdue() {
  return useQuery({ queryKey: queryKeys.overdue, queryFn: () => api<Member[]>('/v1/overdue') })
}

export function useMemberDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.member(id ?? 0),
    queryFn: () => api<MemberDetail>(`/v1/members/${id}`),
    enabled: id !== null,
  })
}

// A payment changes counts, revenue and lists everywhere, so refresh all of them.
function useInvalidateMemberData() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(['members', 'overdue', 'dashboard', 'member'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}

export type AddMemberInput = { name: string; phone: string; planId: number; method: PaymentMethod }

export function useAddMember() {
  const invalidate = useInvalidateMemberData()
  return useMutation({
    mutationFn: (input: AddMemberInput) => api<Member>('/v1/members', { method: 'POST', body: input }),
    onSuccess: invalidate,
  })
}

export type RenewInput = { memberId: number; planId: number; method: PaymentMethod }

export function useRenewMember() {
  const invalidate = useInvalidateMemberData()
  return useMutation({
    mutationFn: ({ memberId, ...body }: RenewInput) => api<Member>(`/v1/members/${memberId}/renew`, { method: 'POST', body }),
    // A 409 means someone else renewed first; refresh so the modal's numbers are current.
    onSettled: invalidate,
  })
}

// ---- devices ----

const WAITING_POLL_MS = 3_000
const STATUS_POLL_MS = 30_000

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: () => api<Device[]>('/v1/devices'),
    // A device waiting for its first connection is polled quickly so the setup screen flips to
    // "connected" by itself; otherwise often enough to keep online/offline honest.
    refetchInterval: (query) => (query.state.data?.some((d) => d.lastSeenAt === null) ? WAITING_POLL_MS : STATUS_POLL_MS),
  })
}

export function useAddDevice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { serialNumber: string; name: string }) => api<Device>('/v1/devices', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices }),
  })
}

export function useRemoveDevice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deviceId: number) => api(`/v1/devices/${deviceId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices }),
  })
}

export function useDeviceCommands(deviceId: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.deviceCommands(deviceId),
    queryFn: () => api<DeviceCommand[]>(`/v1/devices/${deviceId}/commands`),
    enabled,
    // Watch a command go queued → sent → acked while any is in flight.
    refetchInterval: (query) => (query.state.data?.some((c) => c.status === 'queued' || c.status === 'sent') ? WAITING_POLL_MS : false),
  })
}

export function useQueueCommand(deviceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { kind: DeviceCommandKind; from?: string }) =>
      api<DeviceCommand>(`/v1/devices/${deviceId}/commands`, { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceCommands(deviceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.devices }),
      ]),
  })
}

// ---- check-ins ----

export type CheckinFilter = { verdict?: Verdict; from?: string; to?: string; memberId?: number }

export function useCheckins(filter: CheckinFilter) {
  return useInfiniteQuery({
    queryKey: queryKeys.checkins(filter),
    initialPageParam: '',
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: '50' })
      for (const [key, value] of Object.entries(filter)) if (value) params.set(key, String(value))
      if (pageParam) params.set('before', pageParam)
      return api<CheckinPage>(`/v1/checkins?${params}`, { signal })
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: STATUS_POLL_MS,
  })
}
