type Control = {
  name: string;
  description: string;
  adherenceInstructions: string;
};

type ControlGroup = {
  name: string;
  controls: Control[];
};

export type CmmcModel = {
  name: string;
  level: number;
  controlGroups: ControlGroup[];
};

const level1Controls: ControlGroup[] = [
  {
    name: "Access Control",
    controls: [
      {
        name: "AC.L1-b.1.i – Use Individual Accounts",
        description:
          "Only the right people should be allowed into your systems, and they should each have their own login.",
        adherenceInstructions:
          "Give every employee their own username and password. Don’t let people share accounts. Keep a list of who has access and update it when someone leaves.",
      },
      {
        name: "AC.L1-b.1.ii – Limit Access Based on Job",
        description: "People should only see what they need to do their jobs.",
        adherenceInstructions:
          "Set up your systems so employees only have access to the information and tools they need. Review these settings every so often to make sure they’re still accurate.",
      },
      {
        name: "AC.L1-b.1.iii – Manage Outside Connections",
        description:
          "Be careful with how your systems connect to the internet or other services.",
        adherenceInstructions:
          "Know which outside services (like cloud storage or email) your business uses. Make sure only trusted services are connected. Keep a written list of all outside systems you use and why.",
      },
      {
        name: "AC.L1-b.1.iv – Review Public Info",
        description:
          "Check what's shared publicly about your company, especially online.",
        adherenceInstructions:
          "Only allow trusted team members to post on your website or social media. Make sure sensitive company details aren’t being posted by mistake.",
      },
    ],
  },
  {
    name: "Identification & Authentication",
    controls: [
      {
        name: "IA.L1-b.1.v – Know Who’s Logging In",
        description: "Your system should know who is using it at all times.",
        adherenceInstructions:
          "Give each employee their own login. Keep a list of all users and what systems they can access. Remove logins for employees who leave.",
      },
      {
        name: "IA.L1-b.1.vi – Require a Password or Similar Check",
        description: "Users should have to prove who they are to log in.",
        adherenceInstructions:
          "Require passwords (or another method like a code or app). Use strong password rules (e.g., not “1234”). Change passwords when needed or if a breach happens.",
      },
    ],
  },
  {
    name: "Media Protection",
    controls: [
      {
        name: "MP.L1-b.1.vii – Properly Get Rid of Old Computers or Hard Drives",
        description:
          "Before you throw away a computer or device, erase the data completely.",
        adherenceInstructions:
          "Delete everything securely (not just using the trash can icon). Or physically destroy old drives (e.g., with a shredder). Keep a record of when and how you disposed of them.",
      },
    ],
  },
  {
    name: "Physical Protection",
    controls: [
      {
        name: "PE.L1-b.1.viii – Lock Up Sensitive Equipment",
        description:
          "Keep important computers and equipment in locked rooms or areas.",
        adherenceInstructions:
          "Lock server rooms or storage closets. Only let authorized people access those spaces.",
      },
      {
        name: "PE.L1-b.1.ix – Watch Visitors",
        description:
          "Keep track of anyone who visits secure parts of your business.",
        adherenceInstructions:
          "Have visitors sign in and out. Walk them through the building — don’t leave them unattended. Store visitor logs in case you need to look back later.",
      },
    ],
  },
  {
    name: "System & Communications Protection",
    controls: [
      {
        name: "SC.L1-b.1.x – Protect Your Network from Threats",
        description:
          "Use tools to block viruses and hackers from getting into your systems.",
        adherenceInstructions:
          "Install antivirus and firewall software. Make sure it’s working and up to date. Use tools that alert you to suspicious activity.",
      },
      {
        name: "SC.L1-b.1.xi – Keep Your Website Separate from Business Systems",
        description:
          "Your public website should not connect directly to your internal systems.",
        adherenceInstructions:
          "Set up your website in a way that doesn’t give outsiders a path into your sensitive systems. Ask your IT person or service provider to keep them separated.",
      },
    ],
  },
  {
    name: "System & Information Integrity",
    controls: [
      {
        name: "SI.L1-b.1.xii – Fix Security Problems Quickly",
        description:
          "When updates are available for your software, install them right away.",
        adherenceInstructions:
          "Turn on automatic updates where possible. Have someone check monthly to make sure everything’s up to date.",
      },
      {
        name: "SI.L1-b.1.xiii – Protect Against Viruses",
        description: "Use software that can find and block malicious programs.",
        adherenceInstructions:
          "Install antivirus software on all computers. Make sure it updates itself daily. Train employees to avoid suspicious links or downloads.",
      },
      {
        name: "SI.L1-b.1.xiv – Keep Antivirus Tools Updated",
        description: "Your virus protection is only good if it’s current.",
        adherenceInstructions:
          "Turn on auto-updates for your antivirus. Check monthly to confirm it’s working.",
      },
      {
        name: "SI.L1-b.1.xv – Regularly Scan for Threats",
        description: "Run scans to catch harmful software or files.",
        adherenceInstructions:
          "Schedule automatic scans each week. Have antivirus check all emails and downloads. Review scan reports and follow up if there are problems.",
      },
    ],
  },
];

const cmmcLevel1Data: CmmcModel = {
  name: "CMMC Level 1",
  level: 1,
  controlGroups: level1Controls,
};

export { cmmcLevel1Data };
