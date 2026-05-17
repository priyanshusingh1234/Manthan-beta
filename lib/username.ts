export const USERNAME_ALLOWED_REGEX = /^[a-z0-9_]+$/;

export function sanitizeUsernameInput(value: string): string {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_]/g, '');
}

export function isValidUsername(value: string): boolean {
    return USERNAME_ALLOWED_REGEX.test(value);
}
