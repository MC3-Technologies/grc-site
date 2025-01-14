import { describe, test, expect } from "@jest/globals";
import {
  createNewAssessmentQuestions,
  Assessment,
  getNewAssessment,
} from "../src/types/Assesment";
import { RadioQuestion, TextQuestion } from "../src/types/questions";
import {
  SoftwareInventoryEntry,
  HardwareInventoryEntry,
} from "../src/types/questions";

const testQuestions: (TextQuestion | RadioQuestion)[] = [
  {
    section: "example-section",
    id: "q1",
    type: "radio",
    question: "What is your preferred programming language?",
    options: ["JavaScript", "Python", "Go", "Rust"],
    value: "",
    next: "",
    conditionals: [
      { value: "JavaScript", next: "q1a" },
      { value: "Python", next: "q1b" },
    ],
  },
  {
    section: "example-section",
    id: "q1a",
    type: "text",
    question: "What JavaScript framework do you prefer?",
    value: "",
    next: "",
    conditionals: [],
  },
  {
    section: "example-section",
    id: "q1b",
    type: "text",
    question: "What Python framework do you prefer?",
    value: "",
    next: "",
    conditionals: [],
  },
];

describe("Assessment class", () => {
  describe("Assessment questions", () => {
    let assessment: Assessment;

    beforeEach(() => {
      assessment = createNewAssessmentQuestions(testQuestions);
    });

    test("Update non existing question value", () => {
      expect(() => assessment.updateValue("q4", "New value")).toThrow(
        `Updating non-existent question.`
      );
    });

    test("Update question value", () => {
      assessment.updateValue("q1", "Go");

      expect(assessment.getQuestions()).not.toEqual([
        {
          section: "example-section",
          id: "q1",
          type: "radio",
          question: "What is your preferred programming language?",
          options: ["JavaScript", "Python", "Go", "Rust"],
          value: "",
          next: "",
          conditionals: [
            { value: "JavaScript", next: "q1a" },
            { value: "Python", next: "q1b" },
          ],
        },
      ]);
      expect(assessment.getQuestions()).toEqual([
        {
          section: "example-section",
          id: "q1",
          type: "radio",
          question: "What is your preferred programming language?",
          options: ["JavaScript", "Python", "Go", "Rust"],
          value: "Go",
          next: "",
          conditionals: [
            { value: "JavaScript", next: "q1a" },
            { value: "Python", next: "q1b" },
          ],
        },
      ]);
    });

    test("Dynamic next value on conditional value", () => {
      assessment.updateValue("q1", "JavaScript");

      expect(assessment.getQuestions()).not.toEqual([
        {
          section: "example-section",
          id: "q1",
          type: "radio",
          question: "What is your preferred programming language?",
          options: ["JavaScript", "Python", "Go", "Rust"],
          value: "JavaScript",
          next: "",
          conditionals: [
            { value: "JavaScript", next: "q1a" },
            { value: "Python", next: "q1b" },
          ],
        },
      ]);

      expect(assessment.getQuestions()).toEqual([
        {
          section: "example-section",
          id: "q1",
          type: "radio",
          question: "What is your preferred programming language?",
          options: ["JavaScript", "Python", "Go", "Rust"],
          value: "JavaScript",
          next: "",
          conditionals: [
            { value: "JavaScript", next: "q1a" },
            { value: "Python", next: "q1b" },
          ],
        },
        {
          section: "example-section",
          id: "q1a",
          type: "text",
          question: "What JavaScript framework do you prefer?",
          value: "",
          next: "",
          conditionals: [],
        },
      ]);
    });
  });

  describe("Assessment software inventory", () => {
    let assessment: Assessment;

    beforeEach(() => {
      assessment = getNewAssessment();
    });

    test("Add to software inventory already exists", () => {
      const newEntry: SoftwareInventoryEntry = {
        id: "1",
        type: "software-entry",
        name: "Monday.com",
        vendor: "monday",
        criticalSoftware: true,
        cloudBased: true,
        comments: "We use monday for project planning",
      };
      assessment.addSoftwareEntry(newEntry);

      expect(() => assessment.addSoftwareEntry(newEntry)).toThrow(
        `Software entry with ID already exists.`
      );
    });

    test("Add to software inventory", () => {
      const newEntry: SoftwareInventoryEntry = {
        id: "1",
        type: "software-entry",
        name: "Monday.com",
        vendor: "monday",
        criticalSoftware: true,
        cloudBased: true,
        comments: "We use monday for project planning",
      };
      assessment.addSoftwareEntry(newEntry);

      expect(assessment.getSoftwareInventory()).not.toEqual([]);
      expect(assessment.getSoftwareInventory()).toEqual([
        {
          id: "1",
          type: "software-entry",
          name: "Monday.com",
          vendor: "monday",
          criticalSoftware: true,
          cloudBased: true,
          comments: "We use monday for project planning",
        },
      ]);
    });

    test("Remove from software inventory does not exist", () => {
      expect(() => assessment.removeSoftwareEntry("3")).toThrowError(
        `Software entry with ID not found.`
      );
    });

    test("Remove from software inventory", () => {
      const newEntry: SoftwareInventoryEntry = {
        id: "1",
        type: "software-entry",
        name: "Monday.com",
        vendor: "monday",
        criticalSoftware: true,
        cloudBased: true,
        comments: "We use monday for project planning",
      };
      const newEntry2: SoftwareInventoryEntry = {
        id: "2",
        type: "software-entry",
        name: "Google gmail",
        vendor: "google",
        criticalSoftware: true,
        cloudBased: true,
        comments: "We use gmail for organization email",
      };
      assessment.addSoftwareEntry(newEntry);
      assessment.addSoftwareEntry(newEntry2);

      assessment.removeSoftwareEntry("1");

      expect(assessment.getSoftwareInventory()).not.toEqual([
        {
          id: "1",
          type: "software-entry",
          name: "Monday.com",
          vendor: "monday",
          criticalSoftware: true,
          cloudBased: true,
          comments: "We use monday for project planning",
        },
        {
          id: "2",
          type: "software-entry",
          name: "Google gmail",
          vendor: "google",
          criticalSoftware: true,
          cloudBased: true,
          comments: "We use gmail for organization email",
        },
      ]);

      expect(assessment.getSoftwareInventory()).toEqual([
        {
          id: "2",
          type: "software-entry",
          name: "Google gmail",
          vendor: "google",
          criticalSoftware: true,
          cloudBased: true,
          comments: "We use gmail for organization email",
        },
      ]);
    });
  });

  describe("Assessment hardware inventory", () => {
    let assessment: Assessment;

    beforeEach(() => {
      assessment = getNewAssessment();
    });

    test("Add to hardware inventory already exists", () => {
      const newEntry: HardwareInventoryEntry = {
        id: "1",
        type: "hardware-entry",
        name: "CEO Main computer",
        make: "Apple",
        model: "Airbook M2",
        mobileDevice: false,
        comments: "Main daily use computer for CEO",
      };
      assessment.addHardwareEntry(newEntry);

      expect(() => assessment.addHardwareEntry(newEntry)).toThrow(
        `Hardware entry with ID already exists.`
      );
    });

    test("Add to hardware inventory", () => {
      const newEntry: HardwareInventoryEntry = {
        id: "1",
        type: "hardware-entry",
        name: "CEO Main computer",
        make: "Apple",
        model: "Airbook M2",
        mobileDevice: false,
        comments: "Main daily use computer for CEO",
      };
      assessment.addHardwareEntry(newEntry);

      expect(assessment.getHardwareIventory()).not.toEqual([]);
      expect(assessment.getHardwareIventory()).toEqual([
        {
          id: "1",
          type: "hardware-entry",
          name: "CEO Main computer",
          make: "Apple",
          model: "Airbook M2",
          mobileDevice: false,
          comments: "Main daily use computer for CEO",
        },
      ]);
    });

    test("Remove from hardware inventory does not exist", () => {
      expect(() => assessment.removeHardwareEntry("3")).toThrowError(
        `Hardware entry with ID not found.`
      );
    });

    test("Remove from hardware inventory", () => {
      const newEntry: HardwareInventoryEntry = {
        id: "1",
        type: "hardware-entry",
        name: "CEO Main computer",
        make: "Apple",
        model: "Airbook M2",
        mobileDevice: false,
        comments: "Main daily use computer for CEO",
      };
      const newEntry2: HardwareInventoryEntry = {
        id: "2",
        type: "hardware-entry",
        name: "Intern iPhone",
        make: "Apple",
        model: "iPhone 12",
        mobileDevice: true,
        comments: "Main daily use phone for the intern",
      };
      assessment.addHardwareEntry(newEntry);
      assessment.addHardwareEntry(newEntry2);

      assessment.removeHardwareEntry("1");

      expect(assessment.getHardwareIventory()).not.toEqual([
        {
          id: "1",
          type: "hardware-entry",
          name: "CEO Main computer",
          make: "Apple",
          model: "Airbook M2",
          mobileDevice: false,
          comments: "Main daily use computer for CEO",
        },
        {
          id: "2",
          type: "hardware-entry",
          name: "Intern iPhone",
          make: "Apple",
          model: "iPhone 12",
          mobileDevice: true,
          comments: "Main daily use phone for the intern",
        },
      ]);

      expect(assessment.getHardwareIventory()).toEqual([
        {
          id: "2",
          type: "hardware-entry",
          name: "Intern iPhone",
          make: "Apple",
          model: "iPhone 12",
          mobileDevice: true,
          comments: "Main daily use phone for the intern",
        },
      ]);
    });
  });
});
