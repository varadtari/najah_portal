import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { DashboardSummary, Gym, Member, MemberDetail, PaymentMethod, Plan } from './types'

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  gym: ['gym'] as const,
  plans: ['plans'] as const,
  members: (search: string) => ['members', { search }] as const,
  overdue: ['overdue'] as const,
  member: (id: number) => ['member', id] as const,
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
