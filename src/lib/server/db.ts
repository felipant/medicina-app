import { hashPassword } from './crypto';

export type UserRole = 'admin' | 'med';

export interface UserRecord {
	id: string;
	email: string;
	passwordHash: string;
	salt: string;
	role: UserRole;
	createdAt: string;
}

// Global persistence in local dev memory
const memoryUsers = new Map<string, UserRecord>();

// Pre-seed default demo users if empty
async function initDefaultUsers() {
	if (memoryUsers.size === 0) {
		// Default med user
		const medEmail = 'medico@medicina.app';
		const medPass = await hashPassword('123456');
		memoryUsers.set(medEmail.toLowerCase(), {
			id: 'user_med_1',
			email: medEmail,
			passwordHash: medPass.hash,
			salt: medPass.salt,
			role: 'med',
			createdAt: new Date().toISOString()
		});

		// Default admin user (para desenvolvimento local)
		const adminEmail = 'admin@medicina.app';
		const adminPass = await hashPassword('admin123');
		memoryUsers.set(adminEmail.toLowerCase(), {
			id: 'user_admin_1',
			email: adminEmail,
			passwordHash: adminPass.hash,
			salt: adminPass.salt,
			role: 'admin',
			createdAt: new Date().toISOString()
		});
	}
}
initDefaultUsers();

export async function findUserByEmail(platform: App.Platform | undefined, email: string): Promise<UserRecord | null> {
	const normalized = email.toLowerCase().trim();
	
	const env = platform?.env as any;
	// Check D1 database if binding available
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const row = (await db.prepare('SELECT id, email, password_hash as passwordHash, salt, role, created_at as createdAt FROM users WHERE LOWER(email) = ?')
				.bind(normalized)
				.first()) as UserRecord | null;
			if (row) {
				// Garantir que a role tenha fallback para 'med' se estiver vazia
				row.role = row.role || 'med';
				return row;
			}
		} catch (e) {
			console.error('Error fetching user from D1:', e);
		}
	}

	// Fallback to local memory store
	return memoryUsers.get(normalized) || null;
}

// Registros via cadastro da aplicação SEMPRE criam usuários com role 'med'
// Administradores só podem ser adicionados diretamente no banco de dados (Cloudflare D1 / SQL)
export async function createUser(
	platform: App.Platform | undefined,
	email: string,
	passwordHash: string,
	salt: string,
	role: UserRole = 'med'
): Promise<UserRecord> {
	const normalized = email.toLowerCase().trim();
	const newUser: UserRecord = {
		id: 'usr_' + Math.random().toString(36).substring(2, 10),
		email: normalized,
		passwordHash,
		salt,
		role,
		createdAt: new Date().toISOString()
	};

	const env = platform?.env as any;
	// Save in D1 if available
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare('INSERT INTO users (id, email, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
				.bind(newUser.id, newUser.email, newUser.passwordHash, newUser.salt, newUser.role, newUser.createdAt)
				.run();
		} catch (e) {
			console.error('Error saving user to D1:', e);
		}
	}

	// Also store in local memory fallback
	memoryUsers.set(normalized, newUser);
	return newUser;
}

async function ensureD1Tables(db: any) {
	await db.prepare(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			salt TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'med',
			created_at TEXT NOT NULL
		);
	`).run();

	// Safe migration for existing tables that may lack the role column
	try {
		await db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'med';").run();
	} catch (_) {
		// Column already exists, ignore
	}
}
