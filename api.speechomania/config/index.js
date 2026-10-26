import Joi from 'joi'

const schema = Joi.object({
  APP_ENV: Joi.string().valid('local', 'prod').required(),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
  DATABASE_POOL_MAX: Joi.number().integer().min(1).default(10),
  VALKEY_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_AUTH_EMULATOR_HOST: Joi.string(),
  CORS_ORIGINS: Joi.string().required(),
  TRUST_PROXY: Joi.boolean().default(false),
  RATE_LIMIT_PER_MINUTE: Joi.number().integer().min(1).default(300),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'silent').default('info')
}).unknown(true)

export function loadConfig(env) {
  const { value, error } = schema.validate(env, { abortEarly: false, convert: true })
  if (error) throw new Error(`Configuration error: ${error.message}`)
  const isDemoProject = value.FIREBASE_PROJECT_ID.startsWith('demo-')
  if (value.APP_ENV === 'prod' && (value.FIREBASE_AUTH_EMULATOR_HOST || isDemoProject)) {
    throw new Error('Configuration error: APP_ENV=prod cannot use the Firebase emulator or a demo- project')
  }
  if (value.APP_ENV === 'local' && (!value.FIREBASE_AUTH_EMULATOR_HOST || !isDemoProject)) {
    throw new Error('Configuration error: APP_ENV=local must use the Firebase emulator and a demo- project')
  }
  return Object.freeze({ ...value, corsOrigins: value.CORS_ORIGINS.split(',').map((o) => o.trim()) })
}

export const config = loadConfig(process.env)
