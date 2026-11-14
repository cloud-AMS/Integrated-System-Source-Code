import 'dotenv/config';
import path from 'path';
import readline from 'readline';
import { hashPassword, ServerRbacStore } from '../server/rbacStore';

interface CliOptions {
  hashOnly: boolean;
  username?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  department?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { hashOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--hash-only' || arg === '-H') {
      opts.hashOnly = true;
    } else if (arg === '--username' && argv[i + 1]) {
      opts.username = argv[++i];
    } else if (arg === '--fullname' && argv[i + 1]) {
      opts.fullName = argv[++i];
    } else if (arg === '--email' && argv[i + 1]) {
      opts.email = argv[++i];
    } else if (arg === '--role' && argv[i + 1]) {
      opts.roleId = argv[++i];
    } else if (arg === '--department' && argv[i + 1]) {
      opts.department = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
AMS RBAC Developer Bootstrap CLI

Penggunaan:
  npm run auth:bootstrap   [-- --username <user> --fullname "<Nama>" --email <email> --role <roleId>]
  npm run auth:hash        Menghasilkan hash scrypt untuk BOOTSTRAP_DEV_PASSWORD_HASH (tanpa menulis DB)

Environment variables:
  AMS_DATA_DIR             Direktori persisten data RBAC (default: ./data)
  SESSION_SECRET           Opsional: kunci HMAC sesi server
`);
      process.exit(0);
    }
  }
  return opts;
}

function promptText(rl: readline.Interface | null, label: string, defaultValue = ''): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  if (!process.stdin.isTTY || !rl) {
    process.stdout.write(`${label}${suffix}: `);
    return readNonTtyLine().then((answer) => answer.trim() || defaultValue);
  }
  return new Promise((resolve) => {
    rl.question(`${label}${suffix}: `, (answer) => {
      const cleaned = answer.trim();
      resolve(cleaned || defaultValue);
    });
  });
}

let nonTtyBufferedLines: string[] | null = null;

async function readNonTtyLine(): Promise<string> {
  if (!nonTtyBufferedLines) {
    const raw = await new Promise<string>((resolve) => {
      let acc = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => {
        acc += String(chunk);
      });
      process.stdin.on('end', () => resolve(acc));
      process.stdin.resume();
    });
    nonTtyBufferedLines = raw.split(/\r?\n/);
  }
  return nonTtyBufferedLines.shift() ?? '';
}

function promptSecret(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      process.stdout.write(`${label}: `);
      void readNonTtyLine().then(resolve, reject);
      return;
    }

    process.stdout.write(`${label}: `);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let value = '';
    const cleanup = () => {
      stdin.setRawMode(Boolean(wasRaw));
      stdin.pause();
      stdin.removeListener('data', onKey);
    };

    const onKey = (char: string) => {
      if (char === '\u0003') {
        // Ctrl+C
        cleanup();
        process.stdout.write('\n');
        reject(new Error('Dibatalkan oleh pengguna.'));
        return;
      }
      if (char === '\r' || char === '\n') {
        cleanup();
        process.stdout.write('\n');
        resolve(value);
        return;
      }
      if (char === '\u007f' || char === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }
      value += char;
      process.stdout.write('*');
    };

    stdin.on('data', onKey);
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const password = await promptSecret('Kata sandi developer (min. 8 karakter)');
  if (password.length < 8) {
    console.error('Galat: Kata sandi minimal 8 karakter.');
    process.exit(1);
  }

  if (opts.hashOnly) {
    const hashed = hashPassword(password);
    console.log('\nHash scrypt siap pakai untuk BOOTSTRAP_DEV_PASSWORD_HASH:');
    console.log(hashed);
    console.log('\nContoh di .env / Secret Manager:');
    console.log(`BOOTSTRAP_DEV_PASSWORD_HASH="${hashed}"`);
    return;
  }

  const confirm = await promptSecret('Konfirmasi kata sandi');
  if (password !== confirm) {
    console.error('Galat: Konfirmasi kata sandi tidak cocok.');
    process.exit(1);
  }

  const rl = process.stdin.isTTY
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null;
  try {
    const username =
      opts.username?.trim().toLowerCase() ||
      (await promptText(rl, 'Username developer', 'dev.admin')).toLowerCase();
    const fullName =
      opts.fullName?.trim() ||
      (await promptText(rl, 'Nama lengkap developer', 'Developer Utama AMS'));
    const email =
      opts.email?.trim() ||
      (await promptText(rl, 'Email', `${username}@anugrahmitraselaras.co.id`));
    const roleId =
      opts.roleId?.trim() ||
      (await promptText(rl, 'Role ID (it_admin / pjt / dll.)', 'it_admin'));

    const dataDir = path.resolve(process.env.AMS_DATA_DIR?.trim() || path.resolve(process.cwd(), 'data'));
    const store = new ServerRbacStore(dataDir);
    const passwordHash = hashPassword(password);

    const res = store.upsertDeveloperFromCli({
      username,
      passwordHash,
      fullName,
      email,
      roleId,
      department: opts.department
    });

    if (!res.ok) {
      console.error(`Galat: ${res.message}`);
      process.exit(1);
    }

    console.log(
      `\nBerhasil: Akun developer tersembunyi "${res.user.username}" (${res.user.roleName}, akses penuh) ${
        res.created ? 'dibuat baru' : 'diperbarui'
      } dengan hash scrypt di ${path.join(dataDir, 'rbac-db.json')} (tidak ditampilkan di modul RBAC).`
    );
  } finally {
    rl?.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
