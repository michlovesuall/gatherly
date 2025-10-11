"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface HealthResponse {
  status: string;
  database: string;
  error?: string;
}

export default function DbCheck() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HealthResponse>("/health")
      .then((res) => setData(res.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <main
      style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}
    >
      <h1>Neo4j Connection Check (Axios)</h1>
      <p>
        This calls <code>GET /api/health</code> using Axios.
      </p>

      {err && <pre style={{ color: "red" }}>Error: {err}</pre>}

      {data && (
        <pre
          style={{
            background: "#111",
            color: "#eee",
            padding: 16,
            borderRadius: 8,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
