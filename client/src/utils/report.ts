type QuestionAnswer = {
  question: string;
  answer: string;
};

type ControlResult = {
  score: number;
  maxScore: number;
  questionsAnswered: QuestionAnswer[];
};

type ControlGroupResult = {
  score: number;
  maxScore: number;
  controlResults: Map<string, ControlResult>;
};

type ReportResult = {
  controlGroupResults: Map<string, ControlGroupResult>;
  score: number;
  maxScore: number;
};

class Report<T extends Record<string, string>> {
  // Assessment data class variable
  private _assessmentData: T;

  constructor(assessmentData: T) {
    // If assessment data is not an object or is null, throw an error
    if (typeof assessmentData !== "object" || assessmentData === null) {
      throw new Error("Assessment data is not an object or is null!");
    }
    this._assessmentData = assessmentData;
  }

  private _calculateScores = (report: ReportResult): ReportResult => {
    return report;
  };

  public generateReportData = (): ReportResult => {
    // New control group map
    const controlGroupsMap: Map<string, ControlGroupResult> = new Map();
    // Return value placeholder
    let ret: ReportResult = {
      controlGroupResults: controlGroupsMap,
      score: 0,
      maxScore: 0,
    };

    // FOR EACH QUESTION ANSWER IN DATA:
    // 1. Parse question for control group/control -- contains '@'
    // 2. Check if follow up question -- contains 'followup'
    // 3. Check if control group already in return map
    //   If yes :
    //     1. Grab existing map key/value data
    //     2. Mutate that data
    //     3. Set back that data in Map
    //   If no :
    //     1. Create new map entry with that question
    for (const key in this._assessmentData) {
      if (!key.includes("@")) {
        continue;
      }
      if (key.includes("followup")) {
        continue;
      }

      // Extract question, answer, control group and control
      const question = key.split("@")[1];
      const answer = this._assessmentData[key];
      const controlGroup = key.split("@")[0].slice(0, 2);
      const control = key.split("@")[0];

      if (ret.controlGroupResults.has(controlGroup)) {
        console.info("Control group exists in map");

        // Get control group from map
        const getControlGroup = ret.controlGroupResults.get(controlGroup);
        // Throw error if control group  data was not fetched
        if (!getControlGroup) {
          throw new Error(
            "Control group exists in control groups map but no data returned from get"
          );
        }
        // Control group controls map data
        const getControls = getControlGroup.controlResults;

        // Control already exists within control group
        if (getControls.has(control)) {
          // Get the control
          const getControl = getControls.get(control);
          // Throw error if control data was not fetched
          if (!getControl) {
            throw new Error(
              "Control exists in controls map but no data returned from get"
            );
          }

          // Create new question answer object to be added to control question answers array
          const newQuestionAnswer: QuestionAnswer = {
            question,
            answer,
          };

          // Push new question answer object to control question answers array
          getControl.questionsAnswered.push(newQuestionAnswer);
        }
        // Control does not yet exist in control group
        else {
          // Create new control object
          const newControl: ControlResult = {
            score: 0,
            maxScore: 0,
            questionsAnswered: [],
          };

          // Create new question answer object to be added to control question answers array
          const newQuestionAnswer: QuestionAnswer = {
            question,
            answer,
          };

          // Push question answer onto new control question answers array
          newControl.questionsAnswered.push(newQuestionAnswer);
          // Add new control result to controls map
          getControlGroup.controlResults.set(control, newControl);
        }
      } else {
        console.info("Control group does not yet exist in map");

        // Create new question answer
        const newQuestionAnswer: QuestionAnswer = {
          question,
          answer,
        };

        // Create new control
        const newControl: ControlResult = {
          score: 0,
          maxScore: 0,
          questionsAnswered: [newQuestionAnswer],
        };

        // Create new control map
        const newControlMap: Map<string, ControlResult> = new Map();

        // Set new control into new control map
        newControlMap.set(control, newControl);

        // Create new control group
        const newControlGroup: ControlGroupResult = {
          score: 0,
          maxScore: 0,
          controlResults: newControlMap,
        };

        // Set new control group map
        ret.controlGroupResults.set(controlGroup, newControlGroup);
      }
    }

    // Call calculate scores helper method
    ret = this._calculateScores(ret);

    // Return ret
    return ret;
  };
}

export { Report };
