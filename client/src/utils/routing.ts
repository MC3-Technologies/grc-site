const redirectHome = (): void => {
  window.location.href = "/";
};

const redirectToSignIn = (): void => {
  window.location.href = "/auth/?tab=sign-in";
};

export { redirectHome, redirectToSignIn };
