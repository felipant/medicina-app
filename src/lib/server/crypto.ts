// Utilitário de criptografia de senha usando Web Crypto API (SHA-256 com Salt)
// Compatível com Cloudflare Workers e ambientes Node.js modernizados.

export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
	const saltBytes = saltHex
		? hexToBytes(saltHex)
		: crypto.getRandomValues(new Uint8Array(16));

	const encoder = new TextEncoder();
	const passwordBytes = encoder.encode(password);

	// Concatenar salt + password
	const combined = new Uint8Array(saltBytes.length + passwordBytes.length);
	combined.set(saltBytes);
	combined.set(passwordBytes, saltBytes.length);

	const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	const salt = bytesToHex(saltBytes);

	return { hash, salt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
	const result = await hashPassword(password, salt);
	return result.hash === hash;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}
