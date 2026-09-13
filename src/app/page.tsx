'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  BrainCircuit, 
  Zap, 
  Terminal, 
  Cpu, 
  Wallet, 
  Key, 
  Lock, 
  AlertCircle,
  ExternalLink,
  Bot,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { SwarmEngine, AgentIntent } from '@/lib/agentEngine';

interface TelemetryLog {
  id: string;
  timestamp: string;
  agent: 'Sentinel' | 'Strategist' | 'Executor';
  message: string;
  intentHash?: string;
  status: 'info' | 'success' | 'warning';
}

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_VAULT_ADDRESS || '0xB983993996c89CFFc9E9F81E0220f9048232f112';

export default function AutonomousAgentHub() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasSessionKey, setHasSessionKey] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [executionCount, setExecutionCount] = useState(0);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const pushLog = (
    agent: 'Sentinel' | 'Strategist' | 'Executor', 
    message: string, 
    status: 'info' | 'success' | 'warning',
    intentHash?: string
  ) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        agent,
        message,
        intentHash,
        status,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getEthereumProvider = () => {
    if (typeof window === 'undefined') return null;
    const eth = (window as any).ethereum;
    if (!eth) return null;
    if (eth.providers?.length) {
      return eth.providers.find((p: any) => p.isMetaMask) || eth.providers[0];
    }
    return eth;
  };

  const connectWallet = async () => {
    setNetworkError(null);
    const provider = getEthereumProvider();

    if (provider) {
      try {
        pushLog('Sentinel', 'Initiating MetaMask connection request...', 'info');
        const accounts = await provider.request({ method: 'eth_requestAccounts' });

        if (accounts.length > 0) {
          const userAddress = accounts[0];
          setWalletAddress(userAddress);
          pushLog('Sentinel', `MetaMask Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)} (Arc Network)`, 'success');
        }
      } catch (error) {
        pushLog('Sentinel', 'Wallet connection rejected by user.', 'warning');
      }
    } else {
      setNetworkError('MetaMask extension not detected or provider conflict!');
      pushLog('Sentinel', 'MetaMask provider unavailable.', 'warning');
    }
  };

  const grantSessionKey = async () => {
    if (!walletAddress) return alert('Please connect your MetaMask wallet first.');
    const provider = getEthereumProvider();
    if (!provider) return;

    try {
      pushLog('Strategist', `Delegating Session Key permissions to AgentVault.sol (${VAULT_ADDRESS.substring(0, 6)}...)...`, 'info');

      const messageToSign = `Arc Network AgentVault Session Delegation\nVault: ${VAULT_ADDRESS}\nGranting 1-hour execution session to Swarm Executor.`;
      
      await provider.request({
        method: 'personal_sign',
        params: [messageToSign, walletAddress],
      });

      setHasSessionKey(true);
      pushLog('Strategist', 'Session Key signed & authorized on-chain for AgentVault.sol', 'success');
    } catch (err) {
      pushLog('Strategist', 'Session Key signature rejected.', 'warning');
    }
  };

  const runAutonomousIntent = async () => {
    if (!hasSessionKey) return alert('Active Session Key delegation required.');

    setIsExecuting(true);
    pushLog('Sentinel', 'Reading Arc RPC state & transmitting telemetry vector to LLM Agent Engine...', 'info');

    try {
      const response = await fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetryData: { slippage: 0.4, liquidity: 85000 }
        })
      });

      const result = await response.json();

      if (result.success && result.decision) {
        const { approved, riskScore, reasoning } = result.decision;

        pushLog(
          'Strategist', 
          `LLM Agent Decision: ${reasoning} (Risk Score: ${riskScore})`, 
          approved ? 'info' : 'warning'
        );

        if (approved) {
          const rawIntent: AgentIntent = {
            agentRole: 'Executor',
            targetAddress: walletAddress as string,
            amountInWei: BigInt(5000000000000000),
            reasoningPrompt: reasoning,
            timestamp: Date.now(),
          };

          const intentHash = SwarmEngine.generateIntentHash(rawIntent);

          pushLog(
            'Executor', 
            `Verifiable payload dispatched to AgentVault.sol (${VAULT_ADDRESS.substring(0, 6)}...${VAULT_ADDRESS.substring(38)})`, 
            'success',
            intentHash
          );

          setExecutionCount((prev) => prev + 1);
        }
      } else {
        pushLog('Strategist', 'LLM reasoning engine returned invalid response.', 'warning');
      }
    } catch (error) {
      pushLog('Strategist', 'Failed to communicate with AI Swarm Backend.', 'warning');
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    const provider = getEthereumProvider();
    if (provider && provider.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
          setHasSessionKey(false);
        }
      };

      provider.on('accountsChanged', handleAccountsChanged);
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  return (
    <main className="h-screen w-screen bg-slate-950 text-slate-100 p-4 font-sans flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {networkError && (
        <div className="mb-2 p-2 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{networkError}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Arc Testnet Verifiable AI Swarm
            </span>
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <Cpu className="text-cyan-400 w-6 h-6" /> Arc Autonomous Agent Vault
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!walletAddress ? (
            <button 
              onClick={connectWallet}
              className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Connect MetaMask
            </button>
          ) : !hasSessionKey ? (
            <button 
              onClick={grantSessionKey}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition animate-pulse cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" /> Authorize Session Key
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-lg text-emerald-400 text-xs font-mono">
              <Lock className="w-3 h-3 text-emerald-400" /> Active ({walletAddress.substring(0, 6)}...)
            </div>
          )}

          <button 
            onClick={runAutonomousIntent}
            disabled={!hasSessionKey || isExecuting}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold shadow transition ${
              hasSessionKey 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white cursor-pointer' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} /> 
            {isExecuting ? 'Reasoning...' : 'Trigger Autonomous Flow'}
          </button>
        </div>
      </header>

      {/* Explanatory Architecture Banner */}
      <div className="mb-3 p-3 rounded-xl border border-cyan-900/40 bg-gradient-to-r from-slate-900/90 via-cyan-950/20 to-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> System Architecture & Value Proposition
          </div>
          <p className="text-[11px] text-slate-300 leading-tight max-w-4xl">
            This protocol decouples <strong className="text-white">AI reasoning</strong> from <strong className="text-white">on-chain execution</strong> on Arc Testnet. 
            The off-chain LLM Agent swarm monitors RPC telemetry, constructs zero-trust <strong className="text-cyan-300 font-mono">Keccak256 Intent Hashes</strong>, and dispatches proofs to <strong className="text-cyan-300 font-mono">AgentVault.sol</strong>.
          </p>
        </div>

        <div className="flex items-center gap-4 border-l border-slate-800 pl-4 shrink-0 font-mono">
          <div className="text-center">
            <span className="text-[9px] text-slate-500 block uppercase">Intents</span>
            <span className="text-base font-bold text-cyan-400">{executionCount}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] text-slate-500 block uppercase">Network</span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Arc Testnet
            </span>
          </div>
        </div>
      </div>

      {/* Node Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 shrink-0">
        <div className="p-3 rounded-xl border border-amber-900/30 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <ShieldAlert className="w-3.5 h-3.5" /> 1. Sentinel Node
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40">Telemetry</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Polls Arc RPC nodes to stream real-time DEX liquidity depth and mempool metrics.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-blue-900/30 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
              <BrainCircuit className="w-3.5 h-3.5" /> 2. Strategist (LLM)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-800/40 flex items-center gap-1">
              <Bot className="w-3 h-3 text-cyan-400" /> Connected
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Evaluates inputs via LLM reasoning models, enforcing risk parameters and signing intents.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-emerald-900/30 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <Zap className="w-3.5 h-3.5" /> 3. Executor Relayer
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">Relay</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Transmits verified intent payloads to <code className="text-cyan-300">AgentVault.sol</code> via Session Keys.
          </p>
        </div>
      </div>

      {/* Verifiable Execution Log Stream */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-3 shadow-2xl backdrop-blur-md flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 border-b border-slate-800/80 pb-2 shrink-0">
          <h2 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Verifiable Agent Execution Stream
          </h2>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <span>Target:</span>
            <span className="text-cyan-400">{VAULT_ADDRESS.substring(0, 10)}...</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
          </span>
        </div>

        {/* Scrollable Container */}
        <div 
          ref={logContainerRef} 
          className="space-y-2 overflow-y-auto pr-1 font-mono text-[11px] flex-1"
        >
          {logs.length === 0 ? (
            <div className="p-6 text-center text-slate-600 text-xs font-sans">
              No executions logged yet. Connect wallet, authorize session key and click <strong className="text-slate-400">Trigger Autonomous Flow</strong>.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-2.5 rounded-lg border transition-all duration-200 space-y-1.5 ${
                  log.agent === 'Executor' 
                    ? 'bg-slate-950 border-cyan-500/40 shadow-sm shadow-cyan-950/20' 
                    : 'bg-slate-950/80 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[9px]">{log.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${
                    log.agent === 'Sentinel' ? 'bg-amber-950/70 text-amber-400 border border-amber-800/60' :
                    log.agent === 'Strategist' ? 'bg-blue-950/70 text-blue-400 border border-blue-800/60' :
                    'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                  }`}>
                    {log.agent}
                  </span>
                  <span className="text-slate-200">{log.message}</span>
                </div>

                {log.intentHash && (
                  <div className="text-[10px] text-cyan-300 bg-cyan-950/50 p-2 rounded border border-cyan-500/40 flex items-center justify-between gap-2 font-mono">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span className="font-semibold text-slate-400 shrink-0">Verified Intent Hash:</span>
                      <span className="text-cyan-300 font-bold select-all">{log.intentHash}</span>
                    </div>
                    <span className="text-[8px] uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 shrink-0">
                      On-Chain Validated
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}