/**
 * src/pages/Register.jsx
 *
 * Keeps the existing /register route working: it now renders the sliding
 * auth page (AuthSlider), which contains both the login and register forms.
 */

import AuthSlider from "./AuthSlider.jsx";

export default function Register() {
  return <AuthSlider />;
}