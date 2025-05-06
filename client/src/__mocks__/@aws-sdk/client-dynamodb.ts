// Mock for AWS DynamoDB client
interface DynamoDBItem {
  [key: string]: {
    S?: string;
    N?: string;
    BOOL?: boolean;
    NULL?: boolean;
    L?: DynamoDBAttributeValue[];
    M?: Record<string, DynamoDBAttributeValue>;
    SS?: string[];
    NS?: string[];
  };
}

// Define a type for the attribute values
type DynamoDBAttributeValue = {
  S?: string;
  N?: string;
  BOOL?: boolean;
  NULL?: boolean;
  L?: DynamoDBAttributeValue[];
  M?: Record<string, DynamoDBAttributeValue>;
  SS?: string[];
  NS?: string[];
};

interface CommandInput {
  TableName: string;
  [key: string]: unknown;
}

interface Command {
  input: CommandInput;
}

const mockTables = new Map<string, DynamoDBItem[]>();

export class DynamoDBClient {
  constructor() {
    //console.log("Mock DynamoDBClient initialized");
  }

  async send(command: Command): Promise<Record<string, unknown>> {
    if (command instanceof PutItemCommand) {
      return this.handlePutItem(command);
    } else if (command instanceof QueryCommand) {
      return this.handleQuery(command);
    } else if (command instanceof ScanCommand) {
      return this.handleScan(command);
    }
    return {};
  }

  handlePutItem(command: PutItemCommand): Record<string, unknown> {
    const { TableName, Item } = command.input;

    if (!mockTables.has(TableName)) {
      mockTables.set(TableName, []);
    }

    const table = mockTables.get(TableName)!;

    // Check if item with same ID exists
    const idKey = Object.keys(Item).find(
      (key) =>
        key === "id" ||
        key === "ID" ||
        key === "Id" ||
        key.endsWith("id") ||
        key.endsWith("ID"),
    );

    if (idKey) {
      const idValue = Item[idKey].S || Item[idKey].N;
      const existingIndex = table.findIndex(
        (item) => item[idKey]?.S === idValue || item[idKey]?.N === idValue,
      );

      if (existingIndex >= 0) {
        table[existingIndex] = Item;
      } else {
        table.push(Item);
      }
    } else {
      table.push(Item);
    }

    return {};
  }

  handleQuery(command: QueryCommand): { Items?: DynamoDBItem[] } {
    const { TableName, KeyConditionExpression, ExpressionAttributeValues } =
      command.input;

    if (!mockTables.has(TableName)) {
      return { Items: [] };
    }

    const table = mockTables.get(TableName)!;

    // Basic key condition parsing (very simplified)
    if (KeyConditionExpression && ExpressionAttributeValues) {
      // Parse expressions like "id = :id"
      const matches = KeyConditionExpression.match(/(\w+)\s*=\s*:(\w+)/);

      if (matches && matches.length === 3) {
        const [, keyName, valuePlaceholder] = matches;
        const keyValue = ExpressionAttributeValues[`:${valuePlaceholder}`];

        // Find items matching the condition
        const items = table.filter((item) => {
          // Get the actual value (S, N, etc.)
          const itemKeyValue = item[keyName];
          const searchValue = Object.values(keyValue)[0];
          const itemValue = Object.values(itemKeyValue)[0];

          return itemValue === searchValue;
        });

        return { Items: items };
      }
    }

    // Default: return all items
    return { Items: table };
  }

  handleScan(command: ScanCommand): { Items?: DynamoDBItem[] } {
    const { TableName, FilterExpression, ExpressionAttributeValues } =
      command.input;

    if (!mockTables.has(TableName)) {
      return { Items: [] };
    }

    const table = mockTables.get(TableName)!;

    // If filter expression is provided (very simplified implementation)
    if (FilterExpression && ExpressionAttributeValues) {
      // Parse expressions like "status = :status"
      const matches = FilterExpression.match(/(\w+)\s*=\s*:(\w+)/);

      if (matches && matches.length === 3) {
        const [, attrName, valuePlaceholder] = matches;
        const filterValue = ExpressionAttributeValues[`:${valuePlaceholder}`];

        // Find items matching the filter
        const items = table.filter((item) => {
          if (!item[attrName]) return false;

          // Get the actual value (S, N, etc.)
          const itemAttrValue = item[attrName];
          const searchValue = Object.values(filterValue)[0];
          const itemValue = Object.values(itemAttrValue)[0];

          return itemValue === searchValue;
        });

        return { Items: items };
      }
    }

    // Default: return all items
    return { Items: table };
  }
}

export class PutItemCommand {
  constructor(public input: { TableName: string; Item: DynamoDBItem }) {}
}

export class QueryCommand {
  constructor(
    public input: {
      TableName: string;
      KeyConditionExpression?: string;
      FilterExpression?: string;
      ExpressionAttributeValues?: Record<string, Record<string, unknown>>;
      ExpressionAttributeNames?: Record<string, string>;
    },
  ) {}
}

export class ScanCommand {
  constructor(
    public input: {
      TableName: string;
      FilterExpression?: string;
      ExpressionAttributeValues?: Record<string, Record<string, unknown>>;
      ExpressionAttributeNames?: Record<string, string>;
    },
  ) {}
}

// Helper functions for testing
export const __resetMockDynamoDB = (): void => {
  mockTables.clear();
};

export const __setMockTable = (
  tableName: string,
  items: DynamoDBItem[],
): void => {
  mockTables.set(tableName, [...items]);
};

export const __getMockTable = (tableName: string): DynamoDBItem[] => {
  return mockTables.get(tableName) || [];
};

export const __addItemToTable = (
  tableName: string,
  item: DynamoDBItem,
): void => {
  if (!mockTables.has(tableName)) {
    mockTables.set(tableName, []);
  }
  mockTables.get(tableName)!.push(item);
};
