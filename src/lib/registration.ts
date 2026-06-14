import "server-only";

export function registrationIsOpen() {
  return process.env.REGISTRATION_OPEN?.toLowerCase() !== "false";
}
