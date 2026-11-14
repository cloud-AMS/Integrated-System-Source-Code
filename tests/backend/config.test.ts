import { describe, expect, it } from 'vitest';
import { readServerConfig } from '../../backend/config';

const databaseUrl = 'postgresql://ams_user:private-password@127.0.0.1:5432/ams_local';
const remoteUrl = 'postgres://ams_user:private-password@db.example.com/ams_local';

function config(overrides: NodeJS.ProcessEnv = {}) {
  return readServerConfig({ DATABASE_URL: databaseUrl, ...overrides });
}

describe('readServerConfig', () => {
  it('uses explicit credentials and local development defaults without mutating input', () => {
    const env = Object.freeze({ DATABASE_URL: databaseUrl });
    expect(readServerConfig(env)).toEqual({
      host: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      database: {
        connectionString: databaseUrl,
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        statement_timeout: 5000,
        ssl: false,
      },
    });
    expect(env).toEqual({ DATABASE_URL: databaseUrl });
  });

  it('honors PORT 8080 and explicit settings', () => {
    expect(config({ HOST: '0.0.0.0', PORT: '8080', NODE_ENV: 'production', DATABASE_POOL_MAX: '12', DATABASE_TIMEOUT_MS: '15000' }))
      .toMatchObject({
        host: '0.0.0.0', port: 8080, nodeEnv: 'production',
        database: { max: 12, connectionTimeoutMillis: 15000, statement_timeout: 15000, idleTimeoutMillis: 30000 },
      });
  });

  it.each(['development', 'test', 'production'])('accepts NODE_ENV %s', (nodeEnv) => {
    expect(config({ NODE_ENV: nodeEnv }).nodeEnv).toBe(nodeEnv);
  });

  it.each(['', 'staging', 'Production', ' production '])('rejects invalid NODE_ENV %j', (value) => {
    expect(() => config({ NODE_ENV: value })).toThrow('NODE_ENV must be development, test, or production.');
  });

  it.each(['', ' ', ' localhost', 'local host', 'localhost\n'])('rejects invalid HOST %j', (value) => {
    expect(() => config({ HOST: value })).toThrow('HOST must be a non-empty hostname or IP address.');
  });

  it.each([
    ['PORT', '1', 'port', 1], ['PORT', '65535', 'port', 65535],
    ['DATABASE_POOL_MAX', '1', 'max', 1], ['DATABASE_POOL_MAX', '50', 'max', 50],
    ['DATABASE_TIMEOUT_MS', '100', 'statement_timeout', 100],
    ['DATABASE_TIMEOUT_MS', '60000', 'statement_timeout', 60000],
  ] as const)('accepts %s boundary %s', (name, value, field, expected) => {
    const result = config({ [name]: value });
    expect(field === 'port' ? result.port : result.database[field]).toBe(expected);
  });

  describe.each([
    ['PORT', ['0', '65536']],
    ['DATABASE_POOL_MAX', ['0', '51']],
    ['DATABASE_TIMEOUT_MS', ['99', '60001']],
  ])('%s validation', (name, outsideRange) => {
    it.each([...outsideRange, '', ' ', '-1', '1.5', '1e3', '0x10', '10px', 'NaN', 'Infinity', ' 10', '10 ', '99999999999999999999'])
      ('rejects %j', (value) => {
        expect(() => config({ [name]: value })).toThrow(`${name} must be an integer`);
      });
  });

  it('requires DATABASE_URL instead of using PG environment credentials', () => {
    expect(() => readServerConfig({ PGHOST: 'localhost', PGUSER: 'someone', PGPASSWORD: 'secret', PGDATABASE: 'ams' }))
      .toThrow('DATABASE_URL is required.');
    expect(() => config({ DATABASE_URL: '' })).toThrow('DATABASE_URL is required.');
  });

  it.each([
    'not-a-url', 'https://user:password@localhost/ams', '/tmp/socket',
    'postgresql://localhost/ams', 'postgresql://user@localhost/ams',
    'postgresql://:password@localhost/ams', 'postgresql://user:@localhost/ams',
    'postgresql://user:password@/ams', 'postgresql://user:password@localhost',
    'postgresql://user:password@localhost/', 'postgresql://user:password@localhost:0/ams',
    'postgresql://user:password@localhost:65536/ams', 'postgresql://user:password@localhost/ams/extra',
    'postgresql://user:password@localhost/ams#fragment', 'postgresql://user:%ZZ@localhost/ams',
    'postgresql://user:%00@localhost/ams', 'postgresql://user:%20@localhost/ams',
    'postgresql://user:password@localhost/%20', ' postgresql://user:password@localhost/ams',
    'postgresql://user:password@localhost/ams\n',
  ])('rejects incomplete or invalid URL %j', (value) => {
    expect(() => config({ DATABASE_URL: value })).toThrow('DATABASE_URL must be an explicit PostgreSQL URL');
  });

  it.each(['postgres', 'postgresql'])('accepts %s URLs with encoded credentials', (scheme) => {
    const url = `${scheme}://ams%40user:p%40ss%3Aword@localhost/ams?application_name=ams-local`;
    expect(config({ DATABASE_URL: url }).database.connectionString).toBe(url);
  });

  it.each(['localhost', 'LOCALHOST', '127.0.0.1', '[::1]'])('defaults to disabled SSL only for %s', (host) => {
    const url = `postgres://user:password@${host}/ams`;
    expect(config({ DATABASE_URL: url }).database.ssl).toBe(false);
    expect(config({ DATABASE_URL: url, DATABASE_SSL: 'disable' }).database.ssl).toBe(false);
    expect(config({ DATABASE_URL: url, DATABASE_SSL: 'verify-full' }).database.ssl).toEqual({ rejectUnauthorized: true });
  });

  it('defaults remote hosts to verified SSL and accepts explicit verify-full', () => {
    expect(config({ DATABASE_URL: remoteUrl }).database.ssl).toEqual({ rejectUnauthorized: true });
    expect(config({ DATABASE_URL: remoteUrl, DATABASE_SSL: 'verify-full' }).database.ssl).toEqual({ rejectUnauthorized: true });
  });

  it.each(['db.example.com', 'localhost.example.com', '192.168.1.20', '0.0.0.0'])('rejects disabled SSL for %s', (host) => {
    expect(() => config({ DATABASE_URL: `postgres://user:password@${host}/ams`, DATABASE_SSL: 'disable' }))
      .toThrow('DATABASE_SSL disable is allowed only for a loopback database host.');
  });

  it.each(['', 'true', 'false', 'require', 'no-verify', 'verify-ca', 'DISABLE'])('rejects SSL mode %j', (mode) => {
    expect(() => config({ DATABASE_SSL: mode })).toThrow('DATABASE_SSL must be disable or verify-full.');
  });

  it.each([
    'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl', 'sslnegotiation', 'uselibpqcompat',
    'SSLMode', '%73slmode', 'host', 'hostaddr', 'port', 'user', 'password', 'database',
    'query_timeout', 'statement_timeout', 'connect_timeout', 'connectionTimeoutMillis', 'idleTimeoutMillis', 'max',
  ])('rejects URL configuration override %s', (key) => {
    expect(() => config({ DATABASE_URL: `${databaseUrl}?${key}=private-value` }))
      .toThrow('DATABASE_URL must not contain SSL or connection configuration overrides.');
  });

  it.each([
    { DATABASE_URL: 'https://private-user:private-password@private-host/private-database' },
    { DATABASE_URL: `${databaseUrl}?sslmode=private-secret` },
    { HOST: 'private-secret\n' }, { PORT: 'private-secret' }, { NODE_ENV: 'private-secret' },
    { DATABASE_POOL_MAX: 'private-secret' }, { DATABASE_TIMEOUT_MS: 'private-secret' },
    { DATABASE_SSL: 'private-secret' },
    { DATABASE_URL: 'postgres://private-user:private-password@private-host/private-database', DATABASE_SSL: 'disable' },
  ])('does not expose input or nested parser errors', (overrides) => {
    let failure: unknown;
    try {
      config(overrides);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    const error = failure as Error;
    expect(error.message).not.toMatch(/private-|ams_user|ams_local|postgres(?:ql)?:\/\//);
    expect(error.cause).toBeUndefined();
    expect(JSON.stringify(error)).not.toContain('private-');
  });
});
