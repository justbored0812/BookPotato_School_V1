export interface JoinedSchool {
  id: number;
  name: string;
  hubType?: string;
}

export function resolveProfileSchool(schools: JoinedSchool[], currentSchool?: string | null, preferredSchoolId?: number): string {
  const joined = schools.filter(school => school.hubType == null || school.hubType === "school");
  return joined.find(school => school.id === preferredSchoolId)?.name
    || joined.find(school => school.name === currentSchool)?.name
    || joined[0]?.name
    || "";
}
