import { AssessmentStorageData, CompletedAssessment } from "../lib/assessment";

export const fetchAssessmentDataWithCache = async (
  assessmentId: string,
): Promise<AssessmentStorageData> => {
  if (localStorage.getItem(`${assessmentId}_assessmentData`) === null) {
    console.log("Assessment data not found in cache, fetching from storage.");
    // If assessment data is not cached in local storage, fetch from storage to use it and cache it

    // Fetch from storage
    const data =
      await CompletedAssessment.fetchAssessmentStorageData(assessmentId);

    // Cache it
    localStorage.setItem(
      `${assessmentId}_assessmentData`,
      JSON.stringify(data),
    );
    console.log("Assessment data cached for next time.");

    return data;
  }
  // If assessment data is cached in local storage, use it
  console.log("Assessment data in cache.");
  return JSON.parse(
    localStorage.getItem(`${assessmentId}_assessmentData`)!,
  ) as AssessmentStorageData;
};
