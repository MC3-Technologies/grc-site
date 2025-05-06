// Mock for AWS SES (Simple Email Service) client
interface MockEmail {
  source: string;
  destination: {
    ToAddresses: string[];
    CcAddresses?: string[];
    BccAddresses?: string[];
  };
  subject: string;
  htmlBody?: string;
  textBody?: string;
  timestamp: Date;
}

interface SESCommandInput {
  [key: string]: unknown;
}

interface Command {
  input: SESCommandInput;
}

const mockSentEmails: MockEmail[] = [];

export class SESClient {
  constructor() {
    //console.log("Mock SESClient initialized");
  }

  async send(command: Command): Promise<Record<string, unknown>> {
    //console.log("SES Mock: send command called", command);
    if (command instanceof SendEmailCommand) {
      return this.handleSendEmail(command);
    }
    throw new Error("Command not supported in SES mock");
  }

  handleSendEmail(command: SendEmailCommand): Record<string, string> {
    const { Destination, Message, Source } = command.input;

    const email: MockEmail = {
      source: Source,
      destination: Destination,
      subject: Message.Subject.Data,
      htmlBody: Message.Body.Html?.Data,
      textBody: Message.Body.Text?.Data,
      timestamp: new Date(),
    };

    mockSentEmails.push(email);
    //console.log(
    //  "SES Mock: Email pushed to mockSentEmails. Length:",
    //  mockSentEmails.length,
    //);

    return {
      MessageId: `mock-message-id-${mockSentEmails.length}`,
    };
  }
}

export class SendEmailCommand {
  constructor(
    public input: {
      Destination: {
        ToAddresses: string[];
        CcAddresses?: string[];
        BccAddresses?: string[];
      };
      Message: {
        Subject: {
          Data: string;
          Charset?: string;
        };
        Body: {
          Html?: {
            Data: string;
            Charset?: string;
          };
          Text?: {
            Data: string;
            Charset?: string;
          };
        };
      };
      Source: string;
      ReplyToAddresses?: string[];
    },
  ) {}
}

// Helper functions for testing
export const __resetMockSES = (): void => {
  mockSentEmails.length = 0;
};

export const __getMockSentEmails = (): MockEmail[] => {
  return [...mockSentEmails];
};

export const __getLastSentEmail = (): MockEmail | null => {
  if (mockSentEmails.length > 0) {
    return mockSentEmails[mockSentEmails.length - 1];
  }
  return null;
};
