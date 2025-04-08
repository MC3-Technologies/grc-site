// Report.test.ts
import { Report } from "../report";

describe("Report class", () => {
  it("should throw an error if assessment data is null", () => {
    // @ts-expect-error: Testing invalid input (null)
    expect(() => new Report(null)).toThrow(
      "Assessment data is not an object or is null!"
    );
  });

  it("should throw an error if assessment data is not an object", () => {
    // @ts-expect-error: Testing invalid input (string)
    expect(() => new Report("not an object")).toThrow(
      "Assessment data is not an object or is null!"
    );
  });

  it("should generate report data correctly with valid assessment data", () => {
    const assessmentData = {
      // Valid calculable questions (keys with '@' but not containing "followup")
      "AC.L1-b.1.iv@Do you review and approve what company information can be made public (e.g., on your website)?":
        "Yes",
      "IA.L1-b.1.v@Is each person uniquely identified before they can log into your systems?":
        "No",
      // This followup question should be ignored by the Report class
      "AC.L1-b.1.iv@If yes, please list any policies or procedures you may have that enforce this._followup":
        "Some policy",
      // This key does not contain '@' so it is skipped
      nonCalculableKey: "some value",
      // Another followup question to be skipped
      "IA.L1-b.1.v@If yes, do you have an inventory?_followup":
        "Should be skipped",
    };

    const report = new Report(assessmentData);
    const reportData = report.generateReportData();

    // Overall report expects two questions processed
    expect(reportData.score).toBe(1); // Only one "Yes" answer: from AC.L1-b.1.iv question
    expect(reportData.maxScore).toBe(2); // Two processed questions

    // The report data should have two control groups: "AC" and "IA"
    expect(reportData.controlGroupResults.size).toBe(2);

    // Verify "AC" control group and its control
    const acGroup = reportData.controlGroupResults.get("AC");
    expect(acGroup).toBeDefined();
    if (acGroup) {
      expect(acGroup.score).toBe(1);
      expect(acGroup.maxScore).toBe(1);
      // The control key is the part before "@" of the original key
      const acControl = acGroup.controlResults.get("AC.L1-b.1.iv");
      expect(acControl).toBeDefined();
      if (acControl) {
        expect(acControl.score).toBe(1);
        expect(acControl.maxScore).toBe(1);
        expect(acControl.questionsAnswered.length).toBe(1);
        expect(acControl.questionsAnswered[0].question).toBe(
          "Do you review and approve what company information can be made public (e.g., on your website)?"
        );
        expect(acControl.questionsAnswered[0].answer).toBe("Yes");
      }
    }

    // Verify "IA" control group and its control
    const iaGroup = reportData.controlGroupResults.get("IA");
    expect(iaGroup).toBeDefined();
    if (iaGroup) {
      expect(iaGroup.score).toBe(0);
      expect(iaGroup.maxScore).toBe(1);
      const iaControl = iaGroup.controlResults.get("IA.L1-b.1.v");
      expect(iaControl).toBeDefined();
      if (iaControl) {
        expect(iaControl.score).toBe(0);
        expect(iaControl.maxScore).toBe(1);
        expect(iaControl.questionsAnswered.length).toBe(1);
        expect(iaControl.questionsAnswered[0].question).toBe(
          "Is each person uniquely identified before they can log into your systems?"
        );
        expect(iaControl.questionsAnswered[0].answer).toBe("No");
      }
    }
  });
});
