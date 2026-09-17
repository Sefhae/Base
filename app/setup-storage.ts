// Key used to hand a saved 3D setup from /build-your-setup to the inquiry form.
// It lives in its own module so the form page never has to import the builder
// page, which would pull three.js into the form's bundle.
export const SETUP_STORAGE_KEY = 'base-setup-summary';
