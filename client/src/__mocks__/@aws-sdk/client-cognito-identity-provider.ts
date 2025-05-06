// Mock for AWS Cognito Identity Provider client
export const UserStatus = {
  UNCONFIRMED: "UNCONFIRMED",
  CONFIRMED: "CONFIRMED",
  ARCHIVED: "ARCHIVED",
  COMPROMISED: "COMPROMISED",
  UNKNOWN: "UNKNOWN",
  RESET_REQUIRED: "RESET_REQUIRED",
  FORCE_CHANGE_PASSWORD: "FORCE_CHANGE_PASSWORD",
};

export const MessageActionType = {
  RESEND: "RESEND",
  SUPPRESS: "SUPPRESS",
};

// Define command and input types
interface CommandInput {
  UserPoolId: string;
  [key: string]: unknown;
}

interface Command {
  input: CommandInput;
}

// Define user data types
export type AttributeType = {
  Name: string;
  Value: string;
};

export type UserType = {
  Username: string;
  Attributes: AttributeType[];
  UserStatus: string;
  UserCreateDate: Date;
  UserLastModifiedDate: Date;
  Enabled: boolean;
};

export type UserData = {
  attributes?: Record<string, string>;
  enabled?: boolean;
  created?: Date;
  lastModified?: Date;
  temporaryPassword?: string;
};

// Mock user storage
const mockUsers = new Map<string, UserData>();
const mockUserGroups = new Map<string, Set<string>>();

// Mock Cognito client
export class CognitoIdentityProviderClient {
  constructor() {
    //console.log("Mock CognitoIdentityProviderClient initialized");
  }

  async send(command: Command): Promise<Record<string, unknown>> {
    if (command instanceof AdminGetUserCommand) {
      return this.handleAdminGetUser(command);
    } else if (command instanceof ListUsersCommand) {
      return this.handleListUsers();
    } else if (command instanceof AdminAddUserToGroupCommand) {
      return this.handleAdminAddUserToGroup(command);
    } else if (command instanceof AdminDisableUserCommand) {
      return this.handleAdminDisableUser(command);
    } else if (command instanceof AdminEnableUserCommand) {
      return this.handleAdminEnableUser(command);
    } else if (command instanceof AdminCreateUserCommand) {
      return this.handleAdminCreateUser(command);
    } else if (command instanceof AdminUpdateUserAttributesCommand) {
      return this.handleAdminUpdateUserAttributes(command);
    } else if (command instanceof AdminListGroupsForUserCommand) {
      return this.handleAdminListGroupsForUser(command);
    } else if (command instanceof AdminRemoveUserFromGroupCommand) {
      return this.handleAdminRemoveUserFromGroup(command);
    } else if (command instanceof AdminDeleteUserCommand) {
      return this.handleAdminDeleteUser(command);
    }
    return {};
  }

  handleAdminGetUser(command: AdminGetUserCommand): Record<string, unknown> {
    const { Username } = command.input;
    const user = mockUsers.get(Username);

    if (!user) {
      throw new Error("User does not exist");
    }

    return {
      Username,
      UserAttributes: Object.entries(user.attributes || {}).map(
        ([Name, Value]) => ({ Name, Value }),
      ),
      UserStatus: user.enabled ? "CONFIRMED" : "DISABLED",
      UserCreateDate: user.created,
      UserLastModifiedDate: user.lastModified,
      Enabled: user.enabled,
    };
  }

  handleListUsers(): { Users: Partial<UserType>[] } {
    const users = Array.from(mockUsers.entries()).map(([Username, user]) => {
      return {
        Username,
        Attributes: Object.entries(user.attributes || {}).map(
          ([Name, Value]) => ({ Name, Value }),
        ),
        UserStatus: user.enabled ? "CONFIRMED" : "DISABLED",
        UserCreateDate: user.created,
        UserLastModifiedDate: user.lastModified,
        Enabled: user.enabled,
      };
    });

    return { Users: users };
  }

  handleAdminAddUserToGroup(
    command: AdminAddUserToGroupCommand,
  ): Record<string, unknown> {
    const { Username, GroupName } = command.input;
    if (!mockUserGroups.has(Username)) {
      mockUserGroups.set(Username, new Set());
    }
    mockUserGroups.get(Username)!.add(GroupName);
    return {};
  }

  handleAdminDisableUser(
    command: AdminDisableUserCommand,
  ): Record<string, unknown> {
    const { Username } = command.input;
    const user = mockUsers.get(Username);
    if (user) {
      user.enabled = false;
      user.lastModified = new Date();
    }
    return {};
  }

  handleAdminEnableUser(
    command: AdminEnableUserCommand,
  ): Record<string, unknown> {
    const { Username } = command.input;
    const user = mockUsers.get(Username);
    if (user) {
      user.enabled = true;
      user.lastModified = new Date();
    }
    return {};
  }

  handleAdminCreateUser(command: AdminCreateUserCommand): {
    User: Partial<UserType>;
  } {
    const { Username, UserAttributes, TemporaryPassword } = command.input;

    const attributes: Record<string, string> = {};
    if (UserAttributes) {
      UserAttributes.forEach((attr: AttributeType) => {
        attributes[attr.Name] = attr.Value;
      });
    }

    mockUsers.set(Username, {
      attributes,
      enabled: true,
      created: new Date(),
      lastModified: new Date(),
      temporaryPassword: TemporaryPassword,
    });

    return {
      User: {
        Username,
        Attributes: UserAttributes,
        UserStatus: "FORCE_CHANGE_PASSWORD",
        UserCreateDate: new Date(),
        UserLastModifiedDate: new Date(),
        Enabled: true,
      },
    };
  }

  handleAdminUpdateUserAttributes(
    command: AdminUpdateUserAttributesCommand,
  ): Record<string, unknown> {
    const { Username, UserAttributes } = command.input;
    const user = mockUsers.get(Username);

    if (user && UserAttributes) {
      if (!user.attributes) {
        user.attributes = {};
      }

      UserAttributes.forEach((attr: AttributeType) => {
        user.attributes![attr.Name] = attr.Value;
      });

      user.lastModified = new Date();
    }

    return {};
  }

  handleAdminListGroupsForUser(command: AdminListGroupsForUserCommand): {
    Groups: { GroupName: string }[];
  } {
    const { Username } = command.input;
    const groups = mockUserGroups.get(Username) || new Set();

    return {
      Groups: Array.from(groups).map((GroupName) => ({ GroupName })),
    };
  }

  handleAdminRemoveUserFromGroup(
    command: AdminRemoveUserFromGroupCommand,
  ): Record<string, unknown> {
    const { Username, GroupName } = command.input;

    if (mockUserGroups.has(Username)) {
      mockUserGroups.get(Username)!.delete(GroupName);
    }

    return {};
  }

  handleAdminDeleteUser(
    command: AdminDeleteUserCommand,
  ): Record<string, unknown> {
    const { Username } = command.input;
    mockUsers.delete(Username);
    mockUserGroups.delete(Username);
    return {};
  }
}

// Export commands
export class AdminGetUserCommand {
  constructor(public input: { UserPoolId: string; Username: string }) {}
}

export class ListUsersCommand {
  constructor(
    public input: { UserPoolId: string; Limit?: number; Filter?: string },
  ) {}
}

export class AdminAddUserToGroupCommand {
  constructor(
    public input: { UserPoolId: string; Username: string; GroupName: string },
  ) {}
}

export class AdminDisableUserCommand {
  constructor(public input: { UserPoolId: string; Username: string }) {}
}

export class AdminEnableUserCommand {
  constructor(public input: { UserPoolId: string; Username: string }) {}
}

export class AdminCreateUserCommand {
  constructor(
    public input: {
      UserPoolId: string;
      Username: string;
      TemporaryPassword?: string;
      UserAttributes?: AttributeType[];
      MessageAction?: string;
    },
  ) {}
}

export class AdminUpdateUserAttributesCommand {
  constructor(
    public input: {
      UserPoolId: string;
      Username: string;
      UserAttributes: AttributeType[];
    },
  ) {}
}

export class AdminListGroupsForUserCommand {
  constructor(public input: { UserPoolId: string; Username: string }) {}
}

export class AdminRemoveUserFromGroupCommand {
  constructor(
    public input: { UserPoolId: string; Username: string; GroupName: string },
  ) {}
}

export class AdminDeleteUserCommand {
  constructor(public input: { UserPoolId: string; Username: string }) {}
}

// Helper functions for testing
export const __resetMockCognito = (): void => {
  mockUsers.clear();
  mockUserGroups.clear();
};

export const __setMockUser = (username: string, userData: UserData): void => {
  mockUsers.set(username, {
    ...userData,
    created: userData.created || new Date(),
    lastModified: userData.lastModified || new Date(),
  });
};

export const __setMockUserGroups = (
  username: string,
  groups: string[],
): void => {
  mockUserGroups.set(username, new Set(groups));
};

export const __getMockUser = (username: string): UserData | undefined => {
  return mockUsers.get(username);
};

export const __getMockUserGroups = (
  username: string,
): Set<string> | undefined => {
  return mockUserGroups.get(username);
};

export const __getAllMockUsers = (): Array<{ username: string } & UserData> => {
  return Array.from(mockUsers.entries()).map(([username, userData]) => ({
    username,
    ...userData,
  }));
};
