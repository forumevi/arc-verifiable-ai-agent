<h1>🤖 Arc Autonomous Agent Vault</h1>

<p>An autonomous, verifiable multi-agent protocol on <b>Arc Testnet</b> that decouples off-chain LLM reasoning from on-chain execution using cryptographic intent verification (<code>Keccak256</code>) and delegated Session Keys.</p>

<p><b>🌐 Live Demo:</b> <a href="https://arc-verifiable-ai-agent.vercel.app" target="_blank">https://arc-verifiable-ai-agent.vercel.app</a></p>

<hr />

<h2>📐 System Architecture & Workflow</h2>

<pre>
[ Arc RPC / DEX ] ──(Telemetry)──> [ 1. Sentinel Node ]
                                             │
                                             ▼
[ AgentVault.sol ] <──(Session Key)── [ 3. Executor ] <──(Signed Intent)── [ 2. Strategist (LLM) ]
</pre>

<hr />

<h2>🌟 Key Features & Swarm Pipeline</h2>

<ul>
  <li><b>1. Sentinel Node (Telemetry):</b> Continuously polls Arc RPC nodes to stream real-time DEX liquidity depth, mempool slippage vectors, and gas metrics.</li>
  <li><b>2. Strategist (LLM):</b> Evaluates telemetry inputs via off-chain LLM reasoning models, enforces risk parameters, and synthesizes cryptographically signed intents.</li>
  <li><b>3. Executor Relayer:</b> Transmits verified <code>Keccak256 Intent Hashes</code> directly to <code>AgentVault.sol</code> via pre-authorized Session Keys.</li>
  <li><b>Non-Custodial Session Delegation:</b> Allows users to grant temporary execution sessions without sharing or risking primary private keys.</li>
</ul>

<hr />

<h2>🚀 Quick Start</h2>

<p><b>1. Clone the Repository</b></p>
<pre>git clone https://github.com/forumevi/arc-verifiable-ai-agent.git
cd arc-verifiable-ai-agent</pre>

<p><b>2. Install Dependencies</b></p>
<pre>npm install</pre>

<p><b>3. Local Development Server</b></p>
<pre>npm run dev</pre>

<hr />

<h2>📄 Verified Smart Contracts</h2>
<ul>
  <li><b>Network:</b> Arc Testnet (Chain ID: 5042002)</li>
  <li><b>Target Vault:</b> <a href="https://testnet.arcscan.app/address/0xB983993996c89CFFc9E9F81E0220f9048232f112" target="_blank"><code>0xB983993996c89CFFc9E9F81E0220f9048232f112</code></a></li>
</ul>
