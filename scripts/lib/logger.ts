export function log(msg: string, icon = "🧠") {
  console.log(`${icon} ${msg}`);
}

export function line() { 
  console.log("─".repeat(80)); 
}

export function header(title: string) {
  console.log(`\n╔════════════════ ${title} ════════════════╗`);
}