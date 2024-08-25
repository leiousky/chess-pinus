module.exports = {
    apps: [
        {
            name: "chess",
            script: "pinus start -e production --directory /root/chess-pinus",
            env: {
                COMMON_VARIABLE: "true",
                NODE_ENV: "preprod",
            },
            env_production: {
                NODE_ENV: "production",
            },
            log_date_format: "YYYY-MM-DD HH:mm Z"
        },
    ],
}
