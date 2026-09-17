// Key used to hand a saved 3D setup from /build-your-setup to the inquiry form.
// It lives in its own module so the form page never has to import the builder
// page, which would pull three.js into the form's bundle.
export const SETUP_STORAGE_KEY = 'base-setup-summary';

/** Stores the summary for the inquiry form to pick up; storage may be blocked. */
export const stashSetupSummary = (text: string) => {
  try {
    sessionStorage.setItem(SETUP_STORAGE_KEY, text);
  } catch {
    // Private browsing can block storage; the form still works without it.
  }
};
