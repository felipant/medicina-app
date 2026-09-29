import { hashPassword } from './crypto';
import { ESF_SEED_DATA } from './esfSeedData';

export type UserRole = 'admin' | 'med';

export interface UserRecord {
	id: string;
	name: string;
	email: string;
	institution: string;
	passwordHash: string;
	salt: string;
	role: UserRole;
	createdAt: string;
}

export interface SessionRecord {
	id: string;
	userId: string;
	startedAt: string;
	lastSeenAt: string;
	endedAt: string | null;
}

export interface UserUsageMetric {
	id: string;
	name: string;
	email: string;
	institution: string;
	role: UserRole;
	createdAt: string;
	sessionCount: number;
	totalDurationSeconds: number;
	formattedDuration: string;
	lastSeenAt: string | null;
}

export interface HealthUnitRecord {
	id: number;
	name: string;
	phone: string;
	address: string;
	cep: string;
	neighborhood: string;
	city: string;
	state: string;
	email: string | null;
	businessHours: string;
	active: number; // 1 = active, 0 = inactive
	source: 'csv_import' | 'admin_manual';
	createdAt: string;
	updatedAt: string;
}

// In-memory fallbacks for local dev (if D1 binding is not loaded)
const memoryUsers = new Map<string, UserRecord>();
const memoryAttempts: Array<{ ip: string; createdAt: string; userId?: string }> = [];
const memorySessions = new Map<string, SessionRecord>();
const memoryHealthUnits = new Map<number, HealthUnitRecord>();
let memoryHealthUnitNextId = 1;

// Pre-seed default demo users and health units if empty
async function initDefaultUsers() {
	if (memoryUsers.size === 0) {
		const medPass = await hashPassword('123456');
		memoryUsers.set('medico@medicina.app', {
			id: 'user_med_1',
			name: 'Dr. Médico Demonstração',
			email: 'medico@medicina.app',
			institution: 'UFSJ',
			passwordHash: medPass.hash,
			salt: medPass.salt,
			role: 'med',
			createdAt: new Date().toISOString()
		});

		const adminPass = await hashPassword('admin123');
		memoryUsers.set('admin@medicina.app', {
			id: 'user_admin_1',
			name: 'Administrador do Sistema',
			email: 'admin@medicina.app',
			institution: 'UFSJ',
			passwordHash: adminPass.hash,
			salt: adminPass.salt,
			role: 'admin',
			createdAt: new Date().toISOString()
		});
	}

	if (memoryHealthUnits.size === 0) {
		for (const item of ESF_SEED_DATA) {
			const id = memoryHealthUnitNextId++;
			memoryHealthUnits.set(id, {
				id,
				name: item.name,
				phone: item.phone,
				address: item.address,
				cep: item.cep,
				neighborhood: item.neighborhood,
				city: item.city,
				state: item.state,
				email: item.email,
				businessHours: item.businessHours,
				active: 1,
				source: 'csv_import',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});
		}
	}
}
initDefaultUsers();

/**
 * Ensures D1 tables and safe schema migrations exist
 */
export async function ensureD1Tables(db: any) {
	// 1. Users table
	await db.prepare(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL DEFAULT '',
			email TEXT UNIQUE NOT NULL,
			institution TEXT NOT NULL DEFAULT '',
			password_hash TEXT NOT NULL,
			salt TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'med',
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
	`).run();

	// Safe migrations for users columns
	try {
		await db.prepare("ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT '';").run();
	} catch (_) {}
	try {
		await db.prepare("ALTER TABLE users ADD COLUMN institution TEXT NOT NULL DEFAULT '';").run();
	} catch (_) {}
	try {
		await db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'med';").run();
	} catch (_) {}

	// Seed default admin in D1 if not exists
	try {
		const adminRow = await db.prepare("SELECT id FROM users WHERE email = 'admin@medicina.app'").first();
		if (!adminRow) {
			const adminPass = await hashPassword('admin123');
			await db.prepare(`
				INSERT INTO users (id, name, email, institution, password_hash, salt, role, created_at)
				VALUES ('user_admin_1', 'Administrador do Sistema', 'admin@medicina.app', 'UFSJ', ?, ?, 'admin', datetime('now'))
			`).bind(adminPass.hash, adminPass.salt).run();
		}
	} catch (_) {}

	// 2. Registration attempts table for IP rate limiting
	await db.prepare(`
		CREATE TABLE IF NOT EXISTS registration_attempts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			ip_address TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			user_id TEXT
		);
	`).run();

	try {
		await db.prepare(`
			CREATE INDEX IF NOT EXISTS idx_registration_ip_date ON registration_attempts(ip_address, created_at);
		`).run();
	} catch (_) {}

	// 3. Sessions tracking table for usage analytics
	await db.prepare(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			started_at TEXT NOT NULL DEFAULT (datetime('now')),
			last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
			ended_at TEXT,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);
	`).run();

	try {
		await db.prepare(`
			CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
		`).run();
	} catch (_) {}

	// 4. Health units table
	await db.prepare(`
		CREATE TABLE IF NOT EXISTS health_units (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			phone TEXT NOT NULL,
			address TEXT NOT NULL,
			cep TEXT NOT NULL,
			neighborhood TEXT NOT NULL,
			city TEXT NOT NULL,
			state TEXT NOT NULL,
			email TEXT,
			business_hours TEXT NOT NULL,
			active INTEGER NOT NULL DEFAULT 1,
			source TEXT NOT NULL DEFAULT 'admin_manual',
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
	`).run();

	try {
		await db.prepare(`
			CREATE INDEX IF NOT EXISTS idx_health_units_active ON health_units(active);
		`).run();
		await db.prepare(`
			CREATE INDEX IF NOT EXISTS idx_health_units_city ON health_units(city);
		`).run();
	} catch (_) {}

	// Check if health_units is empty, and if so, seed with initial ESF dataset
	try {
		// Clean any previous duplicates from D1
		try {
			await db.prepare("DELETE FROM health_units WHERE name LIKE '%FARMÁCIA%' OR name LIKE '%FARMACIA%'").run();
		} catch (_) {}

		// Clean DDR / RVI from phone numbers in D1
		try {
			await db.prepare("UPDATE health_units SET phone = REPLACE(REPLACE(phone, ' - DDR', ''), ' - RVI', '') WHERE phone LIKE '%DDR%' OR phone LIKE '%RVI%'").run();
		} catch (_) {}

		const countRow = await db.prepare("SELECT COUNT(*) as total FROM health_units").first();
		if (Number(countRow?.total || 0) === 0) {
			const stmt = db.prepare(`
				INSERT INTO health_units (name, phone, address, cep, neighborhood, city, state, email, business_hours, active, source)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'csv_import')
			`);
			const batch = ESF_SEED_DATA.map(item => stmt.bind(
				item.name,
				cleanPhone(item.phone),
				item.address,
				item.cep,
				item.neighborhood,
				item.city,
				item.state,
				item.email || null,
				item.businessHours
			));
			if (batch.length > 0) {
				await db.batch(batch);
			}
		}
	} catch (e) {
		console.error('Error seeding initial health units in D1:', e);
	}
}

/**
 * Checks how many registrations were completed from a given IP in the past 24 hours
 */
export async function countRecentRegistrationsByIP(platform: App.Platform | undefined, ipAddress: string): Promise<number> {
	const ip = ipAddress.trim();
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const row = await db.prepare(
				"SELECT COUNT(*) as total FROM registration_attempts WHERE ip_address = ? AND created_at >= datetime('now', '-24 hours')"
			).bind(ip).first();
			return Number(row?.total || 0);
		} catch (e) {
			console.error('Error counting registration attempts in D1:', e);
		}
	}

	// Memory fallback
	const cutoff = Date.now() - 24 * 60 * 60 * 1000;
	return memoryAttempts.filter(a => a.ip === ip && new Date(a.createdAt).getTime() >= cutoff).length;
}

/**
 * Records a registration attempt by IP
 */
export async function recordRegistrationAttempt(platform: App.Platform | undefined, ipAddress: string, userId?: string): Promise<void> {
	const ip = ipAddress.trim();
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare(
				"INSERT INTO registration_attempts (ip_address, created_at, user_id) VALUES (?, datetime('now'), ?)"
			).bind(ip, userId || null).run();
			return;
		} catch (e) {
			console.error('Error recording registration attempt in D1:', e);
		}
	}

	memoryAttempts.push({ ip, createdAt: new Date().toISOString(), userId });
}

/**
 * Finds user by email (case-insensitive)
 */
export async function findUserByEmail(platform: App.Platform | undefined, email: string): Promise<UserRecord | null> {
	const normalized = email.toLowerCase().trim();
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const row = (await db.prepare(
				'SELECT id, name, email, institution, password_hash as passwordHash, salt, role, created_at as createdAt FROM users WHERE LOWER(email) = ?'
			)
				.bind(normalized)
				.first()) as UserRecord | null;
			if (row) {
				row.role = row.role || 'med';
				row.name = row.name || '';
				row.institution = row.institution || '';
				return row;
			}
		} catch (e) {
			console.error('Error fetching user from D1:', e);
		}
	}

	return memoryUsers.get(normalized) || null;
}

/**
 * Finds user by ID
 */
export async function findUserById(platform: App.Platform | undefined, id: string): Promise<UserRecord | null> {
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const row = (await db.prepare(
				'SELECT id, name, email, institution, password_hash as passwordHash, salt, role, created_at as createdAt FROM users WHERE id = ?'
			)
				.bind(id)
				.first()) as UserRecord | null;
			if (row) {
				row.role = row.role || 'med';
				row.name = row.name || '';
				row.institution = row.institution || '';
				return row;
			}
		} catch (e) {
			console.error('Error fetching user by ID from D1:', e);
		}
	}

	for (const user of memoryUsers.values()) {
		if (user.id === id) return user;
	}
	return null;
}

/**
 * Creates a new user record
 */
export async function createUser(
	platform: App.Platform | undefined,
	data: {
		name: string;
		email: string;
		institution: string;
		passwordHash: string;
		salt: string;
		role?: UserRole;
	}
): Promise<UserRecord> {
	const normalized = data.email.toLowerCase().trim();
	const newUser: UserRecord = {
		id: 'usr_' + Math.random().toString(36).substring(2, 10),
		name: data.name.trim(),
		email: normalized,
		institution: data.institution.trim(),
		passwordHash: data.passwordHash,
		salt: data.salt,
		role: data.role || 'med',
		createdAt: new Date().toISOString()
	};

	const env = platform?.env as any;
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare(
				'INSERT INTO users (id, name, email, institution, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
			)
				.bind(
					newUser.id,
					newUser.name,
					newUser.email,
					newUser.institution,
					newUser.passwordHash,
					newUser.salt,
					newUser.role,
					newUser.createdAt
				)
				.run();
		} catch (e) {
			console.error('Error saving user to D1:', e);
		}
	}

	memoryUsers.set(normalized, newUser);
	return newUser;
}

/**
 * Creates a session for an authenticated user
 */
export async function createSession(platform: App.Platform | undefined, userId: string): Promise<string> {
	const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	const now = new Date().toISOString();
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare(
				"INSERT INTO sessions (id, user_id, started_at, last_seen_at) VALUES (?, ?, datetime('now'), datetime('now'))"
			).bind(sessionId, userId).run();
			return sessionId;
		} catch (e) {
			console.error('Error creating session in D1:', e);
		}
	}

	memorySessions.set(sessionId, {
		id: sessionId,
		userId,
		startedAt: now,
		lastSeenAt: now,
		endedAt: null
	});
	return sessionId;
}

/**
 * Updates the last_seen_at heartbeat timestamp of an active session
 */
export async function updateSessionHeartbeat(platform: App.Platform | undefined, sessionId: string): Promise<void> {
	if (!sessionId) return;
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare(
				"UPDATE sessions SET last_seen_at = datetime('now') WHERE id = ? AND ended_at IS NULL"
			).bind(sessionId).run();
			return;
		} catch (e) {
			console.error('Error updating session heartbeat in D1:', e);
		}
	}

	const s = memorySessions.get(sessionId);
	if (s && !s.endedAt) {
		s.lastSeenAt = new Date().toISOString();
	}
}

/**
 * Marks a session as ended upon logout
 */
export async function endSession(platform: App.Platform | undefined, sessionId: string): Promise<void> {
	if (!sessionId) return;
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare(
				"UPDATE sessions SET ended_at = datetime('now'), last_seen_at = datetime('now') WHERE id = ? AND ended_at IS NULL"
			).bind(sessionId).run();
			return;
		} catch (e) {
			console.error('Error ending session in D1:', e);
		}
	}

	const s = memorySessions.get(sessionId);
	if (s) {
		s.endedAt = new Date().toISOString();
		s.lastSeenAt = s.endedAt;
	}
}

/**
 * Formats duration in seconds into a friendly clinical/admin string (ex: "3h 25min", "45min", "1min")
 */
export function formatDuration(seconds: number): string {
	if (!seconds || seconds <= 0) return '0min';
	const totalMin = Math.round(seconds / 60);
	if (totalMin < 1) return '< 1min';
	const hours = Math.floor(totalMin / 60);
	const mins = totalMin % 60;
	if (hours > 0) {
		return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
	}
	return `${mins}min`;
}

/**
 * Aggregates platform usage metrics for the Admin Dashboard
 */
export async function getAdminUsageMetrics(platform: App.Platform | undefined): Promise<{
	totalUsers: number;
	totalSessions: number;
	totalUsageHours: string;
	users: UserUsageMetric[];
}> {
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);

			const sql = `
				SELECT
					u.id,
					u.name,
					u.email,
					u.institution,
					u.role,
					u.created_at as createdAt,
					COUNT(s.id) as sessionCount,
					COALESCE(
						SUM(
							CAST(
								(strftime('%s', COALESCE(s.ended_at, s.last_seen_at)) - strftime('%s', s.started_at))
							AS INTEGER)
						),
						0
					) as totalDurationSeconds,
					MAX(s.last_seen_at) as lastSeenAt
				FROM users u
				LEFT JOIN sessions s ON u.id = s.user_id
				GROUP BY u.id
				ORDER BY u.created_at DESC;
			`;

			const res = await db.prepare(sql).all();
			const users: UserUsageMetric[] = (res.results || []).map((r: any) => {
				const durationSec = Math.max(0, Number(r.totalDurationSeconds || 0));
				return {
					id: String(r.id),
					name: String(r.name || 'Sem nome cadastrado'),
					email: String(r.email),
					institution: String(r.institution || '-'),
					role: (r.role === 'admin' ? 'admin' : 'med') as UserRole,
					createdAt: String(r.createdAt || ''),
					sessionCount: Number(r.sessionCount || 0),
					totalDurationSeconds: durationSec,
					formattedDuration: formatDuration(durationSec),
					lastSeenAt: r.lastSeenAt ? String(r.lastSeenAt) : null
				};
			});

			const totalUsers = users.length;
			const totalSessions = users.reduce((acc, u) => acc + u.sessionCount, 0);
			const totalSeconds = users.reduce((acc, u) => acc + u.totalDurationSeconds, 0);
			const totalHours = (totalSeconds / 3600).toFixed(1) + 'h';

			return {
				totalUsers,
				totalSessions,
				totalUsageHours: totalHours,
				users
			};
		} catch (e) {
			console.error('Error fetching admin metrics from D1:', e);
		}
	}

	// Memory Fallback
	const usersList: UserUsageMetric[] = [];
	for (const u of memoryUsers.values()) {
		let sessionCount = 0;
		let totalDurationSeconds = 0;
		let lastSeenAt: string | null = null;

		for (const s of memorySessions.values()) {
			if (s.userId === u.id) {
				sessionCount++;
				const start = new Date(s.startedAt).getTime();
				const end = new Date(s.endedAt || s.lastSeenAt).getTime();
				totalDurationSeconds += Math.max(0, Math.round((end - start) / 1000));
				if (!lastSeenAt || new Date(s.lastSeenAt).getTime() > new Date(lastSeenAt).getTime()) {
					lastSeenAt = s.lastSeenAt;
				}
			}
		}

		usersList.push({
			id: u.id,
			name: u.name || 'Sem nome cadastrado',
			email: u.email,
			institution: u.institution || '-',
			role: u.role,
			createdAt: u.createdAt,
			sessionCount,
			totalDurationSeconds,
			formattedDuration: formatDuration(totalDurationSeconds),
			lastSeenAt
		});
	}

	const totalUsers = usersList.length;
	const totalSessions = usersList.reduce((acc, u) => acc + u.sessionCount, 0);
	const totalSeconds = usersList.reduce((acc, u) => acc + u.totalDurationSeconds, 0);
	const totalHours = (totalSeconds / 3600).toFixed(1) + 'h';

	return {
		totalUsers,
		totalSessions,
		totalUsageHours: totalHours,
		users: usersList
	};
}

// ─────────────────────────────────────────────────────────────
// HEALTH UNITS (UNIDADES DE SAÚDE / ESF)
// ─────────────────────────────────────────────────────────────

export function cleanPhone(phone: string): string {
	if (!phone) return '';
	return phone
		.replace(/\s*-\s*DDR/gi, '')
		.replace(/\s*DDR/gi, '')
		.replace(/\s*-\s*RVI/gi, '')
		.replace(/\s*RVI/gi, '')
		.trim();
}

export interface HealthUnitFilters {
	search?: string;
	city?: string;
	activeOnly?: boolean;
}

/**
 * Lists health units with optional filters
 */
export async function getAllHealthUnits(
	platform: App.Platform | undefined,
	filters?: HealthUnitFilters
): Promise<HealthUnitRecord[]> {
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);

			let query = 'SELECT * FROM health_units WHERE 1=1';
			const params: any[] = [];

			if (filters?.activeOnly) {
				query += ' AND active = 1';
			}
			if (filters?.city && filters.city.trim()) {
				query += ' AND city = ?';
				params.push(filters.city.trim());
			}
			if (filters?.search && filters.search.trim()) {
				query += ' AND (name LIKE ? OR neighborhood LIKE ? OR address LIKE ? OR city LIKE ?)';
				const term = `%${filters.search.trim()}%`;
				params.push(term, term, term, term);
			}

			query += ' ORDER BY name ASC';

			const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
			const { results } = await stmt.all();

			const list = (results || []).map((r: any) => ({
				id: Number(r.id),
				name: String(r.name),
				phone: cleanPhone(String(r.phone)),
				address: String(r.address),
				cep: String(r.cep),
				neighborhood: String(r.neighborhood),
				city: String(r.city),
				state: String(r.state),
				email: r.email ? String(r.email) : null,
				businessHours: String(r.business_hours),
				active: Number(r.active ?? 1),
				source: (r.source === 'csv_import' ? 'csv_import' : 'admin_manual') as 'csv_import' | 'admin_manual',
				createdAt: String(r.created_at || ''),
				updatedAt: String(r.updated_at || '')
			}));

			// Deduplicate strictly by name
			const seenNames = new Set<string>();
			return list.filter((u: HealthUnitRecord) => {
				const norm = u.name.toUpperCase().trim();
				if (seenNames.has(norm)) return false;
				seenNames.add(norm);
				return true;
			});
		} catch (e) {
			console.error('Error fetching health units from D1:', e);
		}
	}

	// Memory fallback
	let list = Array.from(memoryHealthUnits.values());

	if (filters?.activeOnly) {
		list = list.filter((u: HealthUnitRecord) => u.active === 1);
	}
	if (filters?.city && filters.city.trim()) {
		const c = filters.city.trim().toLowerCase();
		list = list.filter((u: HealthUnitRecord) => u.city.toLowerCase() === c);
	}
	if (filters?.search && filters.search.trim()) {
		const s = filters.search.trim().toLowerCase();
		list = list.filter((u: HealthUnitRecord) =>
			u.name.toLowerCase().includes(s) ||
			u.neighborhood.toLowerCase().includes(s) ||
			u.address.toLowerCase().includes(s) ||
			u.city.toLowerCase().includes(s)
		);
	}

	const seen = new Set<string>();
	const deduped = list.filter((u: HealthUnitRecord) => {
		const norm = u.name.toUpperCase().trim();
		if (seen.has(norm)) return false;
		seen.add(norm);
		return true;
	});

	return deduped.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gets a specific health unit by ID
 */
export async function getHealthUnitById(
	platform: App.Platform | undefined,
	id: number
): Promise<HealthUnitRecord | null> {
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const r = await db.prepare('SELECT * FROM health_units WHERE id = ?').bind(id).first();
			if (!r) return null;
			return {
				id: Number(r.id),
				name: String(r.name),
				phone: String(r.phone),
				address: String(r.address),
				cep: String(r.cep),
				neighborhood: String(r.neighborhood),
				city: String(r.city),
				state: String(r.state),
				email: r.email ? String(r.email) : null,
				businessHours: String(r.business_hours),
				active: Number(r.active ?? 1),
				source: (r.source === 'csv_import' ? 'csv_import' : 'admin_manual') as 'csv_import' | 'admin_manual',
				createdAt: String(r.created_at || ''),
				updatedAt: String(r.updated_at || '')
			};
		} catch (e) {
			console.error('Error fetching health unit by ID from D1:', e);
		}
	}

	return memoryHealthUnits.get(id) || null;
}

/**
 * Creates a new health unit
 */
export async function createHealthUnit(
	platform: App.Platform | undefined,
	data: {
		name: string;
		phone: string;
		address: string;
		cep: string;
		neighborhood: string;
		city: string;
		state: string;
		email?: string | null;
		businessHours: string;
		active?: number;
		source?: 'csv_import' | 'admin_manual';
	}
): Promise<HealthUnitRecord> {
	const now = new Date().toISOString();
	const active = data.active ?? 1;
	const source = data.source ?? 'admin_manual';
	const email = data.email?.trim() || null;
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const res = await db.prepare(`
				INSERT INTO health_units (name, phone, address, cep, neighborhood, city, state, email, business_hours, active, source, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				data.name.trim(),
				data.phone.trim(),
				data.address.trim(),
				data.cep.trim(),
				data.neighborhood.trim(),
				data.city.trim(),
				data.state.trim(),
				email,
				data.businessHours.trim(),
				active,
				source,
				now,
				now
			).run();

			const newId = Number(res.meta?.last_row_id || 0);
			return {
				id: newId,
				name: data.name.trim(),
				phone: data.phone.trim(),
				address: data.address.trim(),
				cep: data.cep.trim(),
				neighborhood: data.neighborhood.trim(),
				city: data.city.trim(),
				state: data.state.trim(),
				email,
				businessHours: data.businessHours.trim(),
				active,
				source,
				createdAt: now,
				updatedAt: now
			};
		} catch (e) {
			console.error('Error creating health unit in D1:', e);
		}
	}

	// Memory fallback
	const id = memoryHealthUnitNextId++;
	const record: HealthUnitRecord = {
		id,
		name: data.name.trim(),
		phone: data.phone.trim(),
		address: data.address.trim(),
		cep: data.cep.trim(),
		neighborhood: data.neighborhood.trim(),
		city: data.city.trim(),
		state: data.state.trim(),
		email,
		businessHours: data.businessHours.trim(),
		active,
		source,
		createdAt: now,
		updatedAt: now
	};
	memoryHealthUnits.set(id, record);
	return record;
}

/**
 * Updates an existing health unit
 */
export async function updateHealthUnit(
	platform: App.Platform | undefined,
	id: number,
	data: Partial<{
		name: string;
		phone: string;
		address: string;
		cep: string;
		neighborhood: string;
		city: string;
		state: string;
		email: string | null;
		businessHours: string;
		active: number;
	}>
): Promise<HealthUnitRecord | null> {
	const now = new Date().toISOString();
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);

			const current = await getHealthUnitById(platform, id);
			if (!current) return null;

			const updated = {
				name: data.name !== undefined ? data.name.trim() : current.name,
				phone: data.phone !== undefined ? data.phone.trim() : current.phone,
				address: data.address !== undefined ? data.address.trim() : current.address,
				cep: data.cep !== undefined ? data.cep.trim() : current.cep,
				neighborhood: data.neighborhood !== undefined ? data.neighborhood.trim() : current.neighborhood,
				city: data.city !== undefined ? data.city.trim() : current.city,
				state: data.state !== undefined ? data.state.trim() : current.state,
				email: data.email !== undefined ? (data.email?.trim() || null) : current.email,
				businessHours: data.businessHours !== undefined ? data.businessHours.trim() : current.businessHours,
				active: data.active !== undefined ? data.active : current.active,
				updatedAt: now
			};

			await db.prepare(`
				UPDATE health_units
				SET name = ?, phone = ?, address = ?, cep = ?, neighborhood = ?, city = ?, state = ?, email = ?, business_hours = ?, active = ?, updated_at = ?
				WHERE id = ?
			`).bind(
				updated.name,
				updated.phone,
				updated.address,
				updated.cep,
				updated.neighborhood,
				updated.city,
				updated.state,
				updated.email,
				updated.businessHours,
				updated.active,
				updated.updatedAt,
				id
			).run();

			return {
				...current,
				...updated
			};
		} catch (e) {
			console.error('Error updating health unit in D1:', e);
		}
	}

	// Memory fallback
	const current = memoryHealthUnits.get(id);
	if (!current) return null;

	const updated: HealthUnitRecord = {
		...current,
		name: data.name !== undefined ? data.name.trim() : current.name,
		phone: data.phone !== undefined ? data.phone.trim() : current.phone,
		address: data.address !== undefined ? data.address.trim() : current.address,
		cep: data.cep !== undefined ? data.cep.trim() : current.cep,
		neighborhood: data.neighborhood !== undefined ? data.neighborhood.trim() : current.neighborhood,
		city: data.city !== undefined ? data.city.trim() : current.city,
		state: data.state !== undefined ? data.state.trim() : current.state,
		email: data.email !== undefined ? (data.email?.trim() || null) : current.email,
		businessHours: data.businessHours !== undefined ? data.businessHours.trim() : current.businessHours,
		active: data.active !== undefined ? data.active : current.active,
		updatedAt: now
	};
	memoryHealthUnits.set(id, updated);
	return updated;
}

/**
 * Toggles a health unit active status (1 = active, 0 = inactive)
 */
export async function toggleHealthUnitActive(
	platform: App.Platform | undefined,
	id: number,
	active: boolean
): Promise<boolean> {
	const res = await updateHealthUnit(platform, id, { active: active ? 1 : 0 });
	return res !== null;
}

/**
 * Deletes a health unit
 */
export async function deleteHealthUnit(
	platform: App.Platform | undefined,
	id: number
): Promise<boolean> {
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare('DELETE FROM health_units WHERE id = ?').bind(id).run();
			return true;
		} catch (e) {
			console.error('Error deleting health unit in D1:', e);
		}
	}

	return memoryHealthUnits.delete(id);
}

/**
 * Updates a user's password hash and salt
 */
export async function updateUserPassword(
	platform: App.Platform | undefined,
	userId: string,
	passwordHash: string,
	salt: string
): Promise<boolean> {
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare(
				'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?'
			).bind(passwordHash, salt, userId).run();
			return true;
		} catch (e) {
			console.error('Error updating user password in D1:', e);
			return false;
		}
	}

	// Memory fallback
	for (const [email, user] of memoryUsers.entries()) {
		if (user.id === userId) {
			user.passwordHash = passwordHash;
			user.salt = salt;
			memoryUsers.set(email, user);
			return true;
		}
	}
	return false;
}
