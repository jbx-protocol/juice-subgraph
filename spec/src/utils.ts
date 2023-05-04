import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export const network = process.env.NETWORK as "mainnet" | "goerli";

if (!network) {
  console.error("Error: network is undefined");
  process.exit(1);
}

const sgAxios = axios.create({
  baseURL: process.env.SANITY_CHECK_URL,
  headers: { "Content-Type": "application/json" },
});

export async function get(
  entity: string,
  keys: string[] = ["id"],
  where?: string
) {
  const entities = [];

  const entityPlural = entity + "s";

  try {
    const query = `{${entityPlural}( ${
      where ? "where: {" + where + "}," : ""
    } first: 1000 ) { ${keys.join(" ")} }}`;

    const { data } = await sgAxios.post("", {
      query,
    });

    if (data.data && entityPlural in data.data) {
      const _entities = data.data[entityPlural];

      entities.push(..._entities);
    } else {
      throw new Error("Unexpected response" + JSON.stringify(data));
    }
  } catch (e) {
    console.log("Query error:", e);
  }

  return entities;
}

export async function getExhaustive(
  entity: string,
  keys: string[] = ["id"],
  where?: string
) {
  const maxPageSize = 1000;
  const maxPage = 5;

  const entities: any[] = [];

  async function _get(page = 0) {
    const entityPlural = entity + "s";

    try {
      const query = `{${entityPlural}( ${
        where ? "where: {" + where + "}," : ""
      } first: 1000, skip: ${page * maxPageSize} ) { ${keys.join(" ")} }}`;

      const { data } = await sgAxios.post("", {
        query,
      });

      if (data.data && entityPlural in data.data) {
        const _entities = data.data[entityPlural];

        entities.push(..._entities);

        if (_entities.length === maxPageSize && page < maxPage) {
          await _get(page + 1);
        }
      } else {
        throw new Error("Unexpected response" + JSON.stringify(data));
      }
    } catch (e) {
      console.log("Query error:", e);
    }
  }

  await _get(0);

  return entities;
}
