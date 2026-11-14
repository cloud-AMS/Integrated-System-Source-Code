function readInteger(
  value: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env) {
  const host = env.HOST ?? '127.0.0.1';
  if (!host || host.trim() !== host || /[\s\0]/.test(host)) {
    throw new Error('HOST must be a non-empty hostname or IP address.');
  }
  const port = readInteger(env.PORT, 'PORT', 3000, 1, 65535);
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV must be development, test, or production.');
  }

  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');

  let url: URL;
  try {
    url = new URL(connectionString);
    const components = [url.hostname, url.username, url.password, url.pathname.slice(1)].map(decodeURIComponent);
    if (
      !/^postgres(?:ql)?:\/\//.test(connectionString) ||
      /[\s\\]/.test(connectionString) ||
      url.hash ||
      components.some((value) => !value.trim() || value.includes('\0')) ||
      /[/\\\s]/.test(components[0]) ||
      url.pathname.slice(1).includes('/') ||
      (url.port !== '' && Number(url.port) < 1)
    ) {
      throw new Error();
    }
  } catch {
    throw new Error('DATABASE_URL must be an explicit PostgreSQL URL with host, username, password, and database.');
  }

  // pg lets URL parameters override connection and timeout options passed to the pool.
  const protectedParameters = new Set([
    'host', 'hostaddr', 'port', 'user', 'password', 'database', 'uselibpqcompat',
    'query_timeout', 'statement_timeout', 'connect_timeout', 'connectiontimeoutmillis',
    'idletimeoutmillis', 'max',
  ]);
  for (const key of url.searchParams.keys()) {
    const normalized = key.toLowerCase();
    if (normalized.startsWith('ssl') || protectedParameters.has(normalized)) {
      throw new Error('DATABASE_URL must not contain SSL or connection configuration overrides.');
    }
  }

  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase());
  const sslMode = env.DATABASE_SSL ?? (loopback ? 'disable' : 'verify-full');
  if (sslMode !== 'disable' && sslMode !== 'verify-full') {
    throw new Error('DATABASE_SSL must be disable or verify-full.');
  }
  if (sslMode === 'disable' && !loopback) {
    throw new Error('DATABASE_SSL disable is allowed only for a loopback database host.');
  }

  const max = readInteger(env.DATABASE_POOL_MAX, 'DATABASE_POOL_MAX', 10, 1, 50);
  const timeout = readInteger(env.DATABASE_TIMEOUT_MS, 'DATABASE_TIMEOUT_MS', 5000, 100, 60000);
  const ssl: false | { rejectUnauthorized: true } = sslMode === 'disable' ? false : { rejectUnauthorized: true };

  return {
    host,
    port,
    nodeEnv,
    database: {
      connectionString,
      max,
      connectionTimeoutMillis: timeout,
      idleTimeoutMillis: 30000,
      statement_timeout: timeout,
      ssl,
    },
  };
}
