module.exports = {
    apps: [
        {
            name: 'gymlit-backend',
            script: 'app.js',
            interpreter: 'node',
            cwd: 'C:/Users/georg/Downloads/PTYXIAKH',
            env: {
                NODE_ENV: 'development',
            },
            watch: false,
            restart_delay: 5000,
        },
        {
            name: 'gymlit-client',
            script: 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js',
            args: 'run dev',
            cwd: 'C:/Users/georg/Downloads/PTYXIAKH/client',
            interpreter: 'node',
            watch: false,
        },
    ],
};
