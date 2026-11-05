import { hashPassword } from './crypto';
import { ESF_SEED_DATA } from './esfSeedData';
import { EXAMES_CATALOGO } from '$lib/data/examesCatalogo';

export type UserRole = 'admin' | 'med';

export interface MedicationAdminRecord {
	id: number;
	principioAtivoId: number;
	principioAtivo: string;
	concentracao: string;
	formaFarmaceutica: string;
	viaAdministracao: string;
	classeTerapeuticaId: number | null;
	classeCodigo: string;
	classeTerapeutica: string;
}

export interface LabExamRecord {
	id: number;
	material: string;
	nome: string;
	pacote: string;
	unidade: string;
	valoresReferencia: string;
	active: number;
	createdAt: string;
	updatedAt: string;
}

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

const memoryMedications = new Map<number, MedicationAdminRecord>();
let memoryMedicationNextId = 1;
let memoryPrincipioAtivoNextId = 1;
let memoryClasseNextId = 1;

const memoryLabExams = new Map<number, LabExamRecord>();
let memoryLabExamNextId = 1;

const INITIAL_MEDICATIONS_SEED = [
	{ principioAtivo: 'Losartana Potássica', concentracao: '50 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'C09CA01', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Hidroclorotiazida', concentracao: '25 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C03AA03', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Anlodipino (Besilato)', concentracao: '5 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C08CA01', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Enalapril (Maleato)', concentracao: '10 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C09AA02', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Atenolol', concentracao: '50 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C07AB03', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Carvedilol', concentracao: '6,25 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C07AG02', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Espironolactona', concentracao: '25 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C03DA01', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Furosemida', concentracao: '40 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C03CA01', classeTerapeutica: 'Anti-hipertensivos' },
	{ principioAtivo: 'Metformina (Cloridrato)', concentracao: '850 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'A10BA02', classeTerapeutica: 'Antidiabéticos / Hipoglicemiantes' },
	{ principioAtivo: 'Metformina XR', concentracao: '500 mg', formaFarmaceutica: 'Comprimido de liberação prolongada', viaAdministracao: 'Oral', classeCodigo: 'A10BA02', classeTerapeutica: 'Antidiabéticos / Hipoglicemiantes' },
	{ principioAtivo: 'Gliclazida MR', concentracao: '30 mg', formaFarmaceutica: 'Comprimido de liberação modificada', viaAdministracao: 'Oral', classeCodigo: 'A10BB09', classeTerapeutica: 'Antidiabéticos / Hipoglicemiantes' },
	{ principioAtivo: 'Glibenclamida', concentracao: '5 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'A10BB01', classeTerapeutica: 'Antidiabéticos / Hipoglicemiantes' },
	{ principioAtivo: 'Dapagliflozina', concentracao: '10 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'A10BK01', classeTerapeutica: 'Antidiabéticos / Hipoglicemiantes' },
	{ principioAtivo: 'Insulina NPH Humana', concentracao: '100 UI/mL', formaFarmaceutica: 'Injetável', viaAdministracao: 'Subcutânea', classeCodigo: 'A10AC01', classeTerapeutica: 'Antidiabéticos / Hipoglicemiantes' },
	{ principioAtivo: 'Insulina Regular Humana', concentracao: '100 UI/mL', formaFarmaceutica: 'Injetável', viaAdministracao: 'Subcutânea', classeCodigo: 'A10AB01', classeTerapeutica: 'Antidiabéticos / Hipoglicemiantes' },
	{ principioAtivo: 'Sinvastatina', concentracao: '20 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'C10AA01', classeTerapeutica: 'Hipolipemiantes / Estatinas' },
	{ principioAtivo: 'Atorvastatina Cálcica', concentracao: '20 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'C10AA05', classeTerapeutica: 'Hipolipemiantes / Estatinas' },
	{ principioAtivo: 'Rosuvastatina Cálcica', concentracao: '10 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'C10AA07', classeTerapeutica: 'Hipolipemiantes / Estatinas' },
	{ principioAtivo: 'Ciprofibrato', concentracao: '100 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'C10AB08', classeTerapeutica: 'Hipolipemiantes / Estatinas' },
	{ principioAtivo: 'Ácido Acetilsalicílico (AAS)', concentracao: '100 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'B01AC06', classeTerapeutica: 'Anticoagulantes / Antiagregantes' },
	{ principioAtivo: 'Clopidogrel (Bissulfato)', concentracao: '75 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'B01AC04', classeTerapeutica: 'Anticoagulantes / Antiagregantes' },
	{ principioAtivo: 'Varfarina Sódica', concentracao: '5 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'B01AA03', classeTerapeutica: 'Anticoagulantes / Antiagregantes' },
	{ principioAtivo: 'Rivaroxabana', concentracao: '20 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'B01AF01', classeTerapeutica: 'Anticoagulantes / Antiagregantes' },
	{ principioAtivo: 'Omeprazol', concentracao: '20 mg', formaFarmaceutica: 'Cápsula', viaAdministracao: 'Oral', classeCodigo: 'A02BC01', classeTerapeutica: 'Protetores Gástricos / IBP' },
	{ principioAtivo: 'Pantoprazol Sódico', concentracao: '40 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'A02BC02', classeTerapeutica: 'Protetores Gástricos / IBP' },
	{ principioAtivo: 'Levotiroxina Sódica', concentracao: '50 mcg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'H03AA01', classeTerapeutica: 'Hormônios / Tireoide' },
	{ principioAtivo: 'Levotiroxina Sódica', concentracao: '100 mcg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'H03AA01', classeTerapeutica: 'Hormônios / Tireoide' },
	{ principioAtivo: 'Sertralina (Cloridrato)', concentracao: '50 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'N06AB06', classeTerapeutica: 'Psicotrópicos / Antidepressivos / Ansiolíticos' },
	{ principioAtivo: 'Fluoxetina (Cloridrato)', concentracao: '20 mg', formaFarmaceutica: 'Cápsula', viaAdministracao: 'Oral', classeCodigo: 'N06AB03', classeTerapeutica: 'Psicotrópicos / Antidepressivos / Ansiolíticos' },
	{ principioAtivo: 'Escitalopram (Oxalato)', concentracao: '10 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'N06AB10', classeTerapeutica: 'Psicotrópicos / Antidepressivos / Ansiolíticos' },
	{ principioAtivo: 'Amitriptilina (Cloridrato)', concentracao: '25 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'N06AA09', classeTerapeutica: 'Psicotrópicos / Antidepressivos / Ansiolíticos' },
	{ principioAtivo: 'Clonazepam', concentracao: '2,5 mg/mL', formaFarmaceutica: 'Gotas / Solução oral', viaAdministracao: 'Oral', classeCodigo: 'N03AE01', classeTerapeutica: 'Psicotrópicos / Antidepressivos / Ansiolíticos' },
	{ principioAtivo: 'Dipirona Monoidratada', concentracao: '500 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'N02BB02', classeTerapeutica: 'Analgésicos / Anti-inflamatórios (AINEs)' },
	{ principioAtivo: 'Paracetamol', concentracao: '750 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'N02BE01', classeTerapeutica: 'Analgésicos / Anti-inflamatórios (AINEs)' },
	{ principioAtivo: 'Ibuprofeno', concentracao: '600 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'M01AE01', classeTerapeutica: 'Analgésicos / Anti-inflamatórios (AINEs)' },
	{ principioAtivo: 'Amoxicilina', concentracao: '500 mg', formaFarmaceutica: 'Cápsula', viaAdministracao: 'Oral', classeCodigo: 'J01CA04', classeTerapeutica: 'Antibióticos / Antimicrobianos' },
	{ principioAtivo: 'Amoxicilina + Clavulanato de Potássio', concentracao: '875 mg + 125 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'J01CR02', classeTerapeutica: 'Antibióticos / Antimicrobianos' },
	{ principioAtivo: 'Azitromicina Di-hidratada', concentracao: '500 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'J01FA10', classeTerapeutica: 'Antibióticos / Antimicrobianos' },
	{ principioAtivo: 'Cefalexina', concentracao: '500 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'J01DB01', classeTerapeutica: 'Antibióticos / Antimicrobianos' },
	{ principioAtivo: 'Ciprofloxacino (Cloridrato)', concentracao: '500 mg', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'J01MA02', classeTerapeutica: 'Antibióticos / Antimicrobianos' },
	{ principioAtivo: 'Salbutamol (Sulfato)', concentracao: '100 mcg/dose', formaFarmaceutica: 'Spray / Inalatório', viaAdministracao: 'Inalatória', classeCodigo: 'R03AC02', classeTerapeutica: 'Broncodilatadores / Respiratórios' },
	{ principioAtivo: 'Beclometasona (Dipropionato)', concentracao: '250 mcg/dose', formaFarmaceutica: 'Spray / Inalatório', viaAdministracao: 'Inalatória', classeCodigo: 'R03BA01', classeTerapeutica: 'Broncodilatadores / Respiratórios' },
	{ principioAtivo: 'Loratadina', concentracao: '10 mg', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'R06AX13', classeTerapeutica: 'Antialérgicos / Anti-histamínicos' },
	{ principioAtivo: 'Carbonato de Cálcio + Colecalciferol', concentracao: '500 mg + 400 UI', formaFarmaceutica: 'Comprimido', viaAdministracao: 'Oral', classeCodigo: 'A12AX', classeTerapeutica: 'Suplementos / Vitaminas' },
	{ principioAtivo: 'Sulfato Ferroso', concentracao: '40 mg Fe', formaFarmaceutica: 'Comprimido revestido', viaAdministracao: 'Oral', classeCodigo: 'B03AA07', classeTerapeutica: 'Suplementos / Vitaminas' }
];

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

	if (memoryMedications.size === 0) {
		for (const item of INITIAL_MEDICATIONS_SEED) {
			const id = memoryMedicationNextId++;
			memoryMedications.set(id, {
				id,
				principioAtivoId: memoryPrincipioAtivoNextId++,
				principioAtivo: item.principioAtivo,
				concentracao: item.concentracao,
				formaFarmaceutica: item.formaFarmaceutica,
				viaAdministracao: item.viaAdministracao,
				classeTerapeuticaId: memoryClasseNextId++,
				classeCodigo: item.classeCodigo,
				classeTerapeutica: item.classeTerapeutica
			});
		}
	}

	if (memoryLabExams.size === 0) {
		const now = new Date().toISOString();
		for (const item of EXAMES_CATALOGO) {
			const id = memoryLabExamNextId++;
			memoryLabExams.set(id, {
				id,
				material: item.material,
				nome: item.nome,
				pacote: item.pacote,
				unidade: item.unidade,
				valoresReferencia: item.valoresReferencia,
				active: 1,
				createdAt: now,
				updatedAt: now
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

	// 5. Medications tables (classes_terapeuticas, principios_ativos, apresentacoes)
	try {
		await db.prepare(`
			CREATE TABLE IF NOT EXISTS classes_terapeuticas (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				codigo TEXT NOT NULL UNIQUE,
				descricao TEXT
			);
		`).run();

		await db.prepare(`
			CREATE TABLE IF NOT EXISTS principios_ativos (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				nome TEXT NOT NULL UNIQUE
			);
		`).run();

		await db.prepare(`
			CREATE TABLE IF NOT EXISTS apresentacoes (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				principio_ativo_id INTEGER NOT NULL REFERENCES principios_ativos(id),
				classe_terapeutica_id INTEGER REFERENCES classes_terapeuticas(id),
				concentracao TEXT,
				forma_farmaceutica TEXT,
				via_administracao TEXT
			);
		`).run();

		await db.prepare(`
			CREATE INDEX IF NOT EXISTS idx_apresentacoes_pa ON apresentacoes(principio_ativo_id);
		`).run();
		await db.prepare(`
			CREATE INDEX IF NOT EXISTS idx_principios_ativos_nome ON principios_ativos(nome);
		`).run();

		const medCountRow = await db.prepare('SELECT COUNT(*) as total FROM apresentacoes').first();
		if (Number(medCountRow?.total || 0) === 0) {
			for (const item of INITIAL_MEDICATIONS_SEED) {
				await db.prepare('INSERT OR IGNORE INTO principios_ativos (nome) VALUES (?)').bind(item.principioAtivo).run();
				const paRow = await db.prepare('SELECT id FROM principios_ativos WHERE nome = ?').bind(item.principioAtivo).first();

				const codigo = item.classeCodigo || item.classeTerapeutica.substring(0, 12).toUpperCase().replace(/\s+/g, '_');
				await db.prepare('INSERT OR IGNORE INTO classes_terapeuticas (codigo, descricao) VALUES (?, ?)').bind(codigo, item.classeTerapeutica).run();
				const ctRow = await db.prepare('SELECT id FROM classes_terapeuticas WHERE codigo = ?').bind(codigo).first();

				if (paRow?.id) {
					await db.prepare(`
						INSERT INTO apresentacoes (principio_ativo_id, classe_terapeutica_id, concentracao, forma_farmaceutica, via_administracao)
						VALUES (?, ?, ?, ?, ?)
					`).bind(paRow.id, ctRow?.id || null, item.concentracao, item.formaFarmaceutica, item.viaAdministracao).run();
				}
			}
		}
	} catch (e) {
		console.error('Error ensuring medications tables in D1:', e);
	}

	// 6. Laboratory exams table
	try {
		await db.prepare(`
			CREATE TABLE IF NOT EXISTS lab_exams (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				material TEXT NOT NULL,
				nome TEXT NOT NULL,
				pacote TEXT NOT NULL DEFAULT '',
				unidade TEXT NOT NULL DEFAULT '',
				valores_referencia TEXT NOT NULL DEFAULT '',
				active INTEGER NOT NULL DEFAULT 1,
				created_at TEXT NOT NULL DEFAULT (datetime('now')),
				updated_at TEXT NOT NULL DEFAULT (datetime('now'))
			);
		`).run();

		await db.prepare(`
			CREATE INDEX IF NOT EXISTS idx_lab_exams_nome ON lab_exams(nome);
		`).run();

		const labCountRow = await db.prepare('SELECT COUNT(*) as total FROM lab_exams').first();
		if (Number(labCountRow?.total || 0) === 0) {
			const stmt = db.prepare(`
				INSERT INTO lab_exams (material, nome, pacote, unidade, valores_referencia, active)
				VALUES (?, ?, ?, ?, ?, 1)
			`);
			const batch = EXAMES_CATALOGO.map((item) =>
				stmt.bind(item.material, item.nome, item.pacote || '', item.unidade || '', item.valoresReferencia || '')
			);
			if (batch.length > 0) {
				await db.batch(batch);
			}
		}
	} catch (e) {
		console.error('Error ensuring lab_exams table in D1:', e);
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

// ============================================================================
// MEDICATIONS (CATÁLOGO DE MEDICAMENTOS) CRUD
// ============================================================================

export async function getAllMedicationsAdmin(
	platform: App.Platform | undefined,
	options?: { search?: string; limit?: number }
): Promise<{ medications: MedicationAdminRecord[]; totalCount: number }> {
	const env = platform?.env as any;
	const search = options?.search?.trim() || '';
	const limit = options?.limit || 300;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);

			const countRow = await db.prepare('SELECT COUNT(*) as total FROM apresentacoes').first();
			const totalCount = Number(countRow?.total || 0);

			let rowsResult;
			if (search) {
				const pattern = `%${search}%`;
				rowsResult = await db.prepare(`
					SELECT
						a.id,
						a.principio_ativo_id as principioAtivoId,
						pa.nome as principioAtivo,
						COALESCE(a.concentracao, '') as concentracao,
						COALESCE(a.forma_farmaceutica, '') as formaFarmaceutica,
						COALESCE(a.via_administracao, '') as viaAdministracao,
						a.classe_terapeutica_id as classeTerapeuticaId,
						COALESCE(ct.codigo, '') as classeCodigo,
						COALESCE(ct.descricao, '') as classeTerapeutica
					FROM apresentacoes a
					JOIN principios_ativos pa ON pa.id = a.principio_ativo_id
					LEFT JOIN classes_terapeuticas ct ON ct.id = a.classe_terapeutica_id
					WHERE pa.nome LIKE ? OR a.concentracao LIKE ? OR a.forma_farmaceutica LIKE ? OR ct.descricao LIKE ?
					ORDER BY pa.nome ASC, a.concentracao ASC
					LIMIT ?
				`).bind(pattern, pattern, pattern, pattern, limit).all();
			} else {
				rowsResult = await db.prepare(`
					SELECT
						a.id,
						a.principio_ativo_id as principioAtivoId,
						pa.nome as principioAtivo,
						COALESCE(a.concentracao, '') as concentracao,
						COALESCE(a.forma_farmaceutica, '') as formaFarmaceutica,
						COALESCE(a.via_administracao, '') as viaAdministracao,
						a.classe_terapeutica_id as classeTerapeuticaId,
						COALESCE(ct.codigo, '') as classeCodigo,
						COALESCE(ct.descricao, '') as classeTerapeutica
					FROM apresentacoes a
					JOIN principios_ativos pa ON pa.id = a.principio_ativo_id
					LEFT JOIN classes_terapeuticas ct ON ct.id = a.classe_terapeutica_id
					ORDER BY a.id DESC
					LIMIT ?
				`).bind(limit).all();
			}

			return {
				medications: (rowsResult.results || []) as MedicationAdminRecord[],
				totalCount
			};
		} catch (e) {
			console.error('Error fetching medications from D1:', e);
		}
	}

	// Memory fallback
	let list = Array.from(memoryMedications.values());
	const totalCount = list.length;
	if (search) {
		const q = search.toLowerCase();
		list = list.filter(
			(m) =>
				m.principioAtivo.toLowerCase().includes(q) ||
				m.concentracao.toLowerCase().includes(q) ||
				m.formaFarmaceutica.toLowerCase().includes(q) ||
				m.classeTerapeutica.toLowerCase().includes(q)
		);
	}
	list.sort((a, b) => a.principioAtivo.localeCompare(b.principioAtivo, 'pt-BR'));
	return {
		medications: list.slice(0, limit),
		totalCount
	};
}

export async function searchMedicationsCatalog(
	platform: App.Platform | undefined,
	query: string
): Promise<{ medicamentos: any[]; principios_ativos: any[] }> {
	const env = platform?.env as any;
	const q = query.trim();
	if (q.length < 2) return { medicamentos: [], principios_ativos: [] };

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const pattern = `%${q}%`;
			const prefix = `${q}%`;

			const { results } = await db
				.prepare(
					`SELECT
						a.id,
						pa.nome AS principio_ativo,
						a.concentracao,
						a.forma_farmaceutica,
						a.via_administracao,
						ct.codigo AS codigo_atc,
						ct.descricao AS classe_terapeutica
					FROM apresentacoes a
					JOIN principios_ativos pa ON pa.id = a.principio_ativo_id
					LEFT JOIN classes_terapeuticas ct ON ct.id = a.classe_terapeutica_id
					WHERE pa.nome LIKE ?1 OR a.concentracao LIKE ?1 OR ct.descricao LIKE ?1
					ORDER BY
						CASE WHEN pa.nome LIKE ?2 THEN 0 ELSE 1 END,
						pa.nome,
						a.concentracao
					LIMIT 30`
				)
				.bind(pattern, prefix)
				.all();

			const { results: paResults } = await db
				.prepare(
					`SELECT id, nome
					FROM principios_ativos
					WHERE nome LIKE ?1
					ORDER BY
						CASE WHEN nome LIKE ?2 THEN 0 ELSE 1 END,
						nome
					LIMIT 15`
				)
				.bind(pattern, prefix)
				.all();

			return {
				medicamentos: results || [],
				principios_ativos: paResults || []
			};
		} catch (e) {
			console.error('Error searching medications in D1:', e);
		}
	}

	// Memory fallback
	const qLower = q.toLowerCase();
	const allMeds = Array.from(memoryMedications.values());
	const matched = allMeds
		.filter(
			(m) =>
				m.principioAtivo.toLowerCase().includes(qLower) ||
				m.concentracao.toLowerCase().includes(qLower) ||
				m.classeTerapeutica.toLowerCase().includes(qLower)
		)
		.slice(0, 30)
		.map((m) => ({
			id: m.id,
			principio_ativo: m.principioAtivo,
			concentracao: m.concentracao,
			forma_farmaceutica: m.formaFarmaceutica,
			via_administracao: m.viaAdministracao,
			codigo_atc: m.classeCodigo,
			classe_terapeutica: m.classeTerapeutica
		}));

	const uniquePa = new Map<string, { id: number; nome: string }>();
	for (const m of matched) {
		if (!uniquePa.has(m.principio_ativo)) {
			uniquePa.set(m.principio_ativo, { id: m.id, nome: m.principio_ativo });
		}
	}

	return {
		medicamentos: matched,
		principios_ativos: Array.from(uniquePa.values()).slice(0, 15)
	};
}

export async function createMedicationAdmin(
	platform: App.Platform | undefined,
	data: {
		principioAtivo: string;
		concentracao: string;
		formaFarmaceutica: string;
		viaAdministracao: string;
		classeTerapeutica: string;
		classeCodigo?: string;
	}
): Promise<MedicationAdminRecord> {
	const paNome = data.principioAtivo.trim();
	const conc = data.concentracao.trim();
	const forma = data.formaFarmaceutica.trim();
	const via = data.viaAdministracao.trim() || 'Oral';
	const classeDesc = data.classeTerapeutica.trim() || 'Outros / Não classificado';
	const codigo =
		data.classeCodigo?.trim() ||
		'CLS_' +
			classeDesc
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-zA-Z0-9]/g, '_')
				.toUpperCase()
				.substring(0, 16);

	const env = platform?.env as any;
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);

			await db.prepare('INSERT OR IGNORE INTO principios_ativos (nome) VALUES (?)').bind(paNome).run();
			const paRow = await db.prepare('SELECT id FROM principios_ativos WHERE nome = ?').bind(paNome).first();
			const paId = Number(paRow?.id || 1);

			let ctRow = await db
				.prepare('SELECT id, codigo, descricao FROM classes_terapeuticas WHERE LOWER(descricao) = LOWER(?) OR LOWER(codigo) = LOWER(?)')
				.bind(classeDesc, codigo)
				.first();
			if (!ctRow) {
				await db
					.prepare('INSERT OR IGNORE INTO classes_terapeuticas (codigo, descricao) VALUES (?, ?)')
					.bind(codigo, classeDesc)
					.run();
				ctRow = await db
					.prepare('SELECT id, codigo, descricao FROM classes_terapeuticas WHERE codigo = ?')
					.bind(codigo)
					.first();
			}
			const ctId = ctRow?.id ? Number(ctRow.id) : null;

			const res = await db
				.prepare(
					`INSERT INTO apresentacoes (principio_ativo_id, classe_terapeutica_id, concentracao, forma_farmaceutica, via_administracao)
					 VALUES (?, ?, ?, ?, ?)`
				)
				.bind(paId, ctId, conc, forma, via)
				.run();

			const newId = Number(res.meta?.last_row_id || 0);
			return {
				id: newId,
				principioAtivoId: paId,
				principioAtivo: paNome,
				concentracao: conc,
				formaFarmaceutica: forma,
				viaAdministracao: via,
				classeTerapeuticaId: ctId,
				classeCodigo: String(ctRow?.codigo || codigo),
				classeTerapeutica: String(ctRow?.descricao || classeDesc)
			};
		} catch (e) {
			console.error('Error creating medication in D1:', e);
		}
	}

	// Memory fallback
	const id = memoryMedicationNextId++;
	const record: MedicationAdminRecord = {
		id,
		principioAtivoId: memoryPrincipioAtivoNextId++,
		principioAtivo: paNome,
		concentracao: conc,
		formaFarmaceutica: forma,
		viaAdministracao: via,
		classeTerapeuticaId: memoryClasseNextId++,
		classeCodigo: codigo,
		classeTerapeutica: classeDesc
	};
	memoryMedications.set(id, record);
	return record;
}

export async function updateMedicationAdmin(
	platform: App.Platform | undefined,
	id: number,
	data: {
		principioAtivo: string;
		concentracao: string;
		formaFarmaceutica: string;
		viaAdministracao: string;
		classeTerapeutica: string;
		classeCodigo?: string;
	}
): Promise<MedicationAdminRecord | null> {
	const paNome = data.principioAtivo.trim();
	const conc = data.concentracao.trim();
	const forma = data.formaFarmaceutica.trim();
	const via = data.viaAdministracao.trim() || 'Oral';
	const classeDesc = data.classeTerapeutica.trim() || 'Outros / Não classificado';
	const codigo =
		data.classeCodigo?.trim() ||
		'CLS_' +
			classeDesc
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-zA-Z0-9]/g, '_')
				.toUpperCase()
				.substring(0, 16);

	const env = platform?.env as any;
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);

			await db.prepare('INSERT OR IGNORE INTO principios_ativos (nome) VALUES (?)').bind(paNome).run();
			const paRow = await db.prepare('SELECT id FROM principios_ativos WHERE nome = ?').bind(paNome).first();
			const paId = Number(paRow?.id || 1);

			let ctRow = await db
				.prepare('SELECT id, codigo, descricao FROM classes_terapeuticas WHERE LOWER(descricao) = LOWER(?) OR LOWER(codigo) = LOWER(?)')
				.bind(classeDesc, codigo)
				.first();
			if (!ctRow) {
				await db
					.prepare('INSERT OR IGNORE INTO classes_terapeuticas (codigo, descricao) VALUES (?, ?)')
					.bind(codigo, classeDesc)
					.run();
				ctRow = await db
					.prepare('SELECT id, codigo, descricao FROM classes_terapeuticas WHERE codigo = ?')
					.bind(codigo)
					.first();
			}
			const ctId = ctRow?.id ? Number(ctRow.id) : null;

			await db
				.prepare(
					`UPDATE apresentacoes
					 SET principio_ativo_id = ?, classe_terapeutica_id = ?, concentracao = ?, forma_farmaceutica = ?, via_administracao = ?
					 WHERE id = ?`
				)
				.bind(paId, ctId, conc, forma, via, id)
				.run();

			return {
				id,
				principioAtivoId: paId,
				principioAtivo: paNome,
				concentracao: conc,
				formaFarmaceutica: forma,
				viaAdministracao: via,
				classeTerapeuticaId: ctId,
				classeCodigo: String(ctRow?.codigo || codigo),
				classeTerapeutica: String(ctRow?.descricao || classeDesc)
			};
		} catch (e) {
			console.error('Error updating medication in D1:', e);
		}
	}

	const existing = memoryMedications.get(id);
	if (!existing) return null;
	const updated: MedicationAdminRecord = {
		...existing,
		principioAtivo: paNome,
		concentracao: conc,
		formaFarmaceutica: forma,
		viaAdministracao: via,
		classeCodigo: codigo,
		classeTerapeutica: classeDesc
	};
	memoryMedications.set(id, updated);
	return updated;
}

export async function deleteMedicationAdmin(
	platform: App.Platform | undefined,
	id: number
): Promise<boolean> {
	const env = platform?.env as any;
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare('DELETE FROM apresentacoes WHERE id = ?').bind(id).run();
			return true;
		} catch (e) {
			console.error('Error deleting medication in D1:', e);
		}
	}

	return memoryMedications.delete(id);
}

// ============================================================================
// LABORATORY EXAMS (CATÁLOGO DE EXAMES LABORATORIAIS) CRUD
// ============================================================================

export async function getAllLabExams(
	platform: App.Platform | undefined,
	onlyActive = false
): Promise<LabExamRecord[]> {
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const query = onlyActive
				? `SELECT id, material, nome, pacote, unidade, valores_referencia as valoresReferencia, active, created_at as createdAt, updated_at as updatedAt FROM lab_exams WHERE active = 1 ORDER BY nome ASC`
				: `SELECT id, material, nome, pacote, unidade, valores_referencia as valoresReferencia, active, created_at as createdAt, updated_at as updatedAt FROM lab_exams ORDER BY nome ASC`;
			const { results } = await db.prepare(query).all();
			return (results || []) as LabExamRecord[];
		} catch (e) {
			console.error('Error fetching lab exams from D1:', e);
		}
	}

	const list = Array.from(memoryLabExams.values());
	const filtered = onlyActive ? list.filter((item) => item.active === 1) : list;
	return filtered.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function createLabExam(
	platform: App.Platform | undefined,
	data: {
		material: string;
		nome: string;
		pacote?: string;
		unidade?: string;
		valoresReferencia?: string;
		active?: number;
	}
): Promise<LabExamRecord> {
	const now = new Date().toISOString();
	const material = data.material.trim() || 'SANGUE';
	const nome = data.nome.trim();
	const pacote = (data.pacote || '').trim();
	const unidade = (data.unidade || '').trim();
	const valoresReferencia = (data.valoresReferencia || '').trim();
	const active = data.active ?? 1;

	const env = platform?.env as any;
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const res = await db
				.prepare(
					`INSERT INTO lab_exams (material, nome, pacote, unidade, valores_referencia, active, created_at, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(material, nome, pacote, unidade, valoresReferencia, active, now, now)
				.run();

			const newId = Number(res.meta?.last_row_id || 0);
			return {
				id: newId,
				material,
				nome,
				pacote,
				unidade,
				valoresReferencia,
				active,
				createdAt: now,
				updatedAt: now
			};
		} catch (e) {
			console.error('Error creating lab exam in D1:', e);
		}
	}

	const id = memoryLabExamNextId++;
	const record: LabExamRecord = {
		id,
		material,
		nome,
		pacote,
		unidade,
		valoresReferencia,
		active,
		createdAt: now,
		updatedAt: now
	};
	memoryLabExams.set(id, record);
	return record;
}

export async function updateLabExam(
	platform: App.Platform | undefined,
	id: number,
	data: Partial<{
		material: string;
		nome: string;
		pacote: string;
		unidade: string;
		valoresReferencia: string;
		active: number;
	}>
): Promise<LabExamRecord | null> {
	const now = new Date().toISOString();
	const env = platform?.env as any;

	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			const existing = (await db
				.prepare(
					`SELECT id, material, nome, pacote, unidade, valores_referencia as valoresReferencia, active, created_at as createdAt, updated_at as updatedAt FROM lab_exams WHERE id = ?`
				)
				.bind(id)
				.first()) as LabExamRecord | null;
			if (!existing) return null;

			const updated: LabExamRecord = {
				...existing,
				material: data.material !== undefined ? data.material.trim() : existing.material,
				nome: data.nome !== undefined ? data.nome.trim() : existing.nome,
				pacote: data.pacote !== undefined ? data.pacote.trim() : existing.pacote,
				unidade: data.unidade !== undefined ? data.unidade.trim() : existing.unidade,
				valoresReferencia:
					data.valoresReferencia !== undefined ? data.valoresReferencia.trim() : existing.valoresReferencia,
				active: data.active !== undefined ? data.active : existing.active,
				updatedAt: now
			};

			await db
				.prepare(
					`UPDATE lab_exams
					 SET material = ?, nome = ?, pacote = ?, unidade = ?, valores_referencia = ?, active = ?, updated_at = ?
					 WHERE id = ?`
				)
				.bind(
					updated.material,
					updated.nome,
					updated.pacote,
					updated.unidade,
					updated.valoresReferencia,
					updated.active,
					updated.updatedAt,
					id
				)
				.run();

			return updated;
		} catch (e) {
			console.error('Error updating lab exam in D1:', e);
		}
	}

	const existing = memoryLabExams.get(id);
	if (!existing) return null;
	const updated: LabExamRecord = {
		...existing,
		material: data.material !== undefined ? data.material.trim() : existing.material,
		nome: data.nome !== undefined ? data.nome.trim() : existing.nome,
		pacote: data.pacote !== undefined ? data.pacote.trim() : existing.pacote,
		unidade: data.unidade !== undefined ? data.unidade.trim() : existing.unidade,
		valoresReferencia:
			data.valoresReferencia !== undefined ? data.valoresReferencia.trim() : existing.valoresReferencia,
		active: data.active !== undefined ? data.active : existing.active,
		updatedAt: now
	};
	memoryLabExams.set(id, updated);
	return updated;
}

export async function deleteLabExam(
	platform: App.Platform | undefined,
	id: number
): Promise<boolean> {
	const env = platform?.env as any;
	if (env?.medicina_app_db) {
		try {
			const db = env.medicina_app_db;
			await ensureD1Tables(db);
			await db.prepare('DELETE FROM lab_exams WHERE id = ?').bind(id).run();
			return true;
		} catch (e) {
			console.error('Error deleting lab exam in D1:', e);
		}
	}

	return memoryLabExams.delete(id);
}
