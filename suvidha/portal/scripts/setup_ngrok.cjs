const { exec, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

console.log("Authenticating ngrok...");
exec('npx --yes ngrok config add-authtoken 3AcwXj9T5M3JSHE3aKcYACQoNxZ_7nfFazaNxCHschGUUNSZJ', (err, stdout, stderr) => {
    if (err) {
        console.error("Error adding token:", err);
        return;
    }
    console.log("Token added. Killing existing ngrok processes if any...");

    // Windows taskkill
    exec('taskkill /f /im ngrok.exe', (err) => {
        console.log("Starting new ngrok tunnel on port 3001...");

        const ngrokProcess = spawn('npx.cmd', ['--yes', 'ngrok', 'http', '3001'], {
            detached: true,
            stdio: 'ignore'
        });
        ngrokProcess.unref();

        console.log("Waiting for ngrok to spin up...");
        setTimeout(() => {
            console.log("Fetching tunnel URL from localhost:4040...");
            http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.tunnels && parsed.tunnels.length > 0) {
                            const publicUrl = parsed.tunnels[0].public_url;
                            console.log("Success! Found active Ngrok URL:", publicUrl);

                            const envPath = 'd:\\JanSuvidha\\suvidha\\portal\\.env.local';
                            let envContent = '';
                            if (fs.existsSync(envPath)) {
                                envContent = fs.readFileSync(envPath, 'utf8');
                            }

                            if (envContent.includes('VITE_PUBLIC_BASE_URL=')) {
                                envContent = envContent.replace(/VITE_PUBLIC_BASE_URL=.*/, `VITE_PUBLIC_BASE_URL=${publicUrl}`);
                            } else {
                                envContent += `\nVITE_PUBLIC_BASE_URL=${publicUrl}\n`;
                            }

                            fs.writeFileSync(envPath, envContent.trim(), 'utf8');
                            console.log("Injected URL into .env.local!");
                            process.exit(0);
                        } else {
                            console.log("No tunnels found. Ngrok might have failed to start.");
                            process.exit(1);
                        }
                    } catch (e) {
                        console.error("Failed to parse ngrok API response:", e.message);
                        process.exit(1);
                    }
                });
            }).on('error', (e) => {
                console.error("Error fetching from ngrok local API. Ensure ngrok started properly:", e.message);
                process.exit(1);
            });
        }, 5000); // 5 seconds to ensure it starts
    });
});
