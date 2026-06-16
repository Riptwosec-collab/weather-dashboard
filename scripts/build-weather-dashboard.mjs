import { spawn } from "node:child_process";

const child = spawn("npm install --prefix weather-dashboard --include=dev --legacy-peer-deps --ignore-scripts && npm run build --prefix weather-dashboard", {
  env: {
    ...process.env,
    DISABLE_PWA: "1"
  },
  shell: true,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
