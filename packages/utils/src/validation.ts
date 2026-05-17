export function isValidIndianPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");

  const withoutCountryCode = cleaned.replace(/^(\+91|91)/, "");

  return /^[6-9][0-9]{9}$/.test(withoutCountryCode);
}
