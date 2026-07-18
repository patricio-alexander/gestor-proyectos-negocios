module.exports = {
  apps: [
    {
      name: "Raptor Solutions",
      script: "npm",
      args: "run start",
      autorestart: true,
      env: {
        PORT: 3002,
      },
    },
    {
      name: "worker-realtime",
      script: "npm",
      args: "run worker:realtime",
      autorestart: true,
    },
    {
      name: "worker-usage",
      script: "npm",
      args: "run worker:usage",
      autorestart: true,
    },
    {
      name: "worker-listener-folders",
      script: "npm",
      args: "run worker:listener-folders",
      autorestart: true,
    },
    {
      name: "worker-polling-db-size",
      script: "npm",
      args: "run worker:polling-db-size",
      autorestart: true,
    },
  ],
};
