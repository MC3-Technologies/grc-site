const redirectHome = (): void => {
  window.location.href = "/";
};

const redirectToSignIn = (): void => {
  window.location.href = "/auth/?tab=sign-in";
};

const redirectToAssessments = (): void => {
  window.location.href = "/assessments/";
};

const redirectToInProgressAssessment = (assessmentId: string): void => {
  window.location.href = `/assessment/?assessment-id=${encodeURIComponent(assessmentId)}`;
};

const redirectToCompletedAssessment = (assessmentId: string): void => {
  window.location.href = `/completed-assessment/?assessment-id=${encodeURIComponent(assessmentId)}`;
};

const redirectToAccount = (): void => {
  window.location.href = "/account/";
};

const openCompletedAssessmentNewTab = (assessmentId: string): void => {
  const url = `/completed-assessment/?assessment-id=${encodeURIComponent(assessmentId)}`;
  window.open(url, "_blank");
};

const openInProgressAssessmentNewTab = (assessmentId: string): void => {
  const url = `/assessment/?assessment-id=${encodeURIComponent(assessmentId)}`;
  window.open(url, "_blank");
};

const redirectToReport = (assessmentId: string): void => {
  window.location.href = `/report/?assessment-id=${assessmentId}`;
};

export {
  redirectHome,
  redirectToSignIn,
  redirectToAssessments,
  redirectToInProgressAssessment,
  redirectToCompletedAssessment,
  redirectToAccount,
  redirectToReport,
  openCompletedAssessmentNewTab,
  openInProgressAssessmentNewTab,
};
