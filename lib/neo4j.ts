import neo4j, { Driver, Session } from "neo4j-driver";

declare global {
  var __neo4jDriver: Driver | undefined;
}

function createDriver() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const pass = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !pass) {
    throw new Error("Missing Neo4j connection environment variables.");
  }

  return neo4j.driver(uri, neo4j.auth.basic(user, pass), {
    maxConnectionPoolSize: 50,
  });
}

export function getDriver(): Driver {
  if (!global.__neo4jDriver) {
    global.__neo4jDriver = createDriver();
  }
  return global.__neo4jDriver;
}

function convertNeo4jValue(value: unknown): unknown {
  if (neo4j.isInt(value)) {
    return (value as any).toNumber();
  }
  if (Array.isArray(value)) {
    return value.map((v) => convertNeo4jValue(v));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = convertNeo4jValue(v);
    }
    return result;
  }
  return value;
}

export async function runQuery<T = unknown>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const driver = getDriver();

  const db = process.env.NEO4J_DB;
  const session: Session = driver.session({
    database: db,
    defaultAccessMode: "WRITE",
  });

  // Ensure integer parameters (e.g., LIMIT values) are passed as Neo4j integers
  const normalizedParams = Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "number" && Number.isInteger(value)) {
        return [key, neo4j.int(value)];
      }
      return [key, value];
    })
  );

  try {
    const res = await session.run(cypher, normalizedParams);
    return res.records.map((r) => convertNeo4jValue(r.toObject())) as T[];
  } finally {
    await session.close();
  }
}
