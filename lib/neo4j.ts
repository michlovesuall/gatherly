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

  try {
    const res = await session.run(cypher, params);
    return res.records.map((r) => r.toObject()) as T[];
  } finally {
    await session.close();
  }
}
