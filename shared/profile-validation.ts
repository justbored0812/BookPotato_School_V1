import { resolveProfileSchool } from "./profile-school";

export interface ProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
}

export function validateProfile(user: any, joinedSocieties: any[] = []): ProfileValidationResult {
  const missingFields: string[] = [];
  
  if (!user) {
    return { isComplete: false, missingFields: ["User data not found"] };
  }

  // Basic mandatory fields for everyone
  const mandatoryFields = [
    { key: "name", label: "Full Name" },
    { key: "email", label: "Email Address" },
    { key: "phone", label: "Phone Number" },
    { key: "flatWing", label: "Flat / Wing" },
    { key: "buildingName", label: "Building Name" },
    { key: "detailedAddress", label: "Detailed Address" },
    { key: "city", label: "City" }
  ];

  mandatoryFields.forEach(field => {
    const value = (user as any)[field.key];
    if (!value || value === "Not provided" || value === "0000000000") {
      missingFields.push(field.label);
    }
  });

  // School details are mandatory for the school book sharing platform
  if (!resolveProfileSchool(joinedSocieties, user.school) && !user.school?.trim()) {
    missingFields.push("School");
  }
  if (!user.grade || user.grade.trim() === "") {
    missingFields.push("Grade");
  }
  if (!user.division || user.division.trim() === "") {
    missingFields.push("Division");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}
