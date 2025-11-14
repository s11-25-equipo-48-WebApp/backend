    export default () => ({
    port: Number(process.env.PORT),
    nodeEnv: process.env.NODE_ENV,
    database: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        name: process.env.DB_NAME,
    },
    sentryDsn: process.env.SENTRY_DSN ?? '',
    });
