import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

export function useSchoolMembership() {
  const auth = useQuery({ queryKey: ["/api/auth/me"], queryFn: getCurrentUser });
  const membership = useQuery<any[]>({
    queryKey: ["/api/societies/my"],
    enabled: !!auth.data?.user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  return {
    schools: membership.data ?? [],
    hasSchool: !!auth.data?.user && !membership.isError && !!membership.data?.length,
    isLoading: auth.isLoading || (!!auth.data?.user && membership.isLoading),
    error: !!auth.data?.user && membership.isError,
    retry: membership.refetch,
  };
}
