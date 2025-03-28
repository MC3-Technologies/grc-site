// Mock for AWS DynamoDB Utilities
interface DynamoDBAttributeValue {
  S?: string;
  N?: string;
  BOOL?: boolean;
  NULL?: boolean;
  L?: DynamoDBAttributeValue[];
  M?: Record<string, DynamoDBAttributeValue>;
  SS?: string[];
  NS?: string[];
}

interface DynamoDBItem {
  [key: string]: DynamoDBAttributeValue;
}

export const marshall = (item: Record<string, unknown>): DynamoDBItem => {
  if (!item || typeof item !== "object") {
    return {} as DynamoDBItem;
  }

  const result: DynamoDBItem = {};

  for (const [key, value] of Object.entries(item)) {
    if (value === undefined || value === null) {
      // Skip undefined and null values
      continue;
    }

    if (typeof value === "string") {
      result[key] = { S: value };
    } else if (typeof value === "number") {
      result[key] = { N: value.toString() };
    } else if (typeof value === "boolean") {
      result[key] = { BOOL: value };
    } else if (value instanceof Date) {
      result[key] = { S: value.toISOString() };
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result[key] = { L: [] };
      } else if (typeof value[0] === "string") {
        result[key] = { SS: value as string[] };
      } else if (typeof value[0] === "number") {
        result[key] = { NS: (value as number[]).map((n) => n.toString()) };
      } else {
        result[key] = {
          L: (value as unknown[]).map((v) => marshall({ value: v }).value),
        };
      }
    } else if (typeof value === "object") {
      result[key] = { M: marshall(value as Record<string, unknown>) };
    }
  }

  return result;
};

export const unmarshall = (item: DynamoDBItem): Record<string, unknown> => {
  if (!item || typeof item !== "object") {
    return item as unknown as Record<string, unknown>;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(item)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (value.S !== undefined) {
      result[key] = value.S;
    } else if (value.N !== undefined) {
      result[key] = Number(value.N);
    } else if (value.BOOL !== undefined) {
      result[key] = value.BOOL;
    } else if (value.NULL !== undefined) {
      result[key] = null;
    } else if (value.SS !== undefined) {
      result[key] = value.SS;
    } else if (value.NS !== undefined) {
      result[key] = value.NS.map((n: string) => Number(n));
    } else if (value.L !== undefined) {
      result[key] = value.L.map(
        (v: DynamoDBAttributeValue) => unmarshall({ value: v }).value,
      );
    } else if (value.M !== undefined) {
      result[key] = unmarshall(value.M);
    }
  }

  return result;
};
