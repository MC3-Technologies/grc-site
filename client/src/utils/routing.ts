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
  window.location.href = `/assessment/?assessment-id=${assessmentId}`;
};

export {
  redirectHome,
  redirectToSignIn,
  redirectToAssessments,
  redirectToInProgressAssessment,
};
