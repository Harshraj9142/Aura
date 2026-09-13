"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, Trash2, Key, Terminal } from "lucide-react";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/user/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (error) {
      console.error("Failed to fetch keys", error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName || "New API Key" }),
      });
      if (res.ok) {
        setNewName("");
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to generate key", error);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this key? It will immediately stop working.")) return;
    try {
      const res = await fetch(`/api/user/keys?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to delete key", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 lg:p-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">API Key Management</h1>
        <p className="text-slate-500 mt-2">
          Generate and manage API keys to programmatically access the AURA platform. 
          Keep your keys secure and never share them publicly.
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Secret Key</h2>
        <form onSubmit={generateKey} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Key Name (Optional)</label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Development Env, Integration Script" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
          <button 
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Generating..." : "Generate Key"}
          </button>
        </form>
      </div>

      {/* Active Keys List */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Active API Keys</h2>
        {loading ? (
          <p className="text-slate-500">Loading keys...</p>
        ) : keys.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <Key className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">You don't have any active API keys.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900">{k.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-slate-100 text-indigo-700 px-2 py-1 rounded">
                      {k.key}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(k.key)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Created on {new Date(k.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => deleteKey(k.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation Snippet */}
      <div className="bg-slate-900 rounded-2xl p-8 shadow-lg text-white">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-display font-bold">How to use your API key</h2>
        </div>
        <p className="text-slate-300 mb-6 text-sm">
          Include your secret key in the <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded">Authorization</code> header as a Bearer token.
        </p>
        
        <div className="bg-black rounded-lg p-4 overflow-x-auto border border-white/10">
          <pre className="text-sm text-green-400 font-mono">
{`curl -X GET "http://localhost:3000/api/fares?origin=DEL&destination=BOM" \\
  -H "Authorization: Bearer aura_live_YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>
      </div>
    </div>
  );
}
