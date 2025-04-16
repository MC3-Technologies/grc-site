type QuestionAnswer = {
  question: string;
  answer: string | number;
  shortFormQuestion?: string;
  followUp: string | number | null;
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

export type ReportResult = {
  controlGroupResults: Map<string, ControlGroupResult>;
  score: number;
  maxScore: number;
};

class Report {
  // Assessment data class variable
  private _assessmentData: Map<string, string | number>;

  constructor(assessmentData: Record<string, string|number>) {
    // If assessment data is not an object or is null, throw an error
    if (assessmentData === null) {
      throw new Error("Assessment data is null!");
    }
    console.log(Object.entries(assessmentData))

    const questionAnswerMap = new Map<string, string | number>(
      Object.entries(assessmentData)
    );
    this._assessmentData = questionAnswerMap;
  }

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
    //   If no :
    //     1. Create new map entry with that question

    // Loop through all assessment data
    for (const [key] of this._assessmentData.entries()) {
      // Skip loop iteration if question does not contain '@' which symbolizes a calculatable question
      if (!key.includes("@")) {
        continue;
      }
      // Follow up questions may contain '@' but are not calculatable so skip
      if (key.includes("_followup")) {
        continue;
      }

      // Extract question, answer, control group and control
      const question = key.split("@")[1];
      const shortFormQuestion = key.split("@")[2];
      const answer = this._assessmentData.get(key)!;
      const controlGroup = key.split("@")[0].slice(0, 2);
      const control = key.split("@")[0];

      if (ret.controlGroupResults.has(controlGroup)) {
        // Get control group from map
        const getControlGroup = ret.controlGroupResults.get(controlGroup)!;
        // Control group controls map data
        const getControls = getControlGroup.controlResults;

        // Control already exists within control group
        if (getControls.has(control)) {
          // Get the control
          const getControl = getControls.get(control)!;

          // Create new question answer object to be added to control question answers array
          const newQuestionAnswer: QuestionAnswer = {
            shortFormQuestion,
            question,
            answer,
            followUp: this._getFollowUp(shortFormQuestion),
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
            shortFormQuestion,
            question,
            answer,
            followUp: this._getFollowUp(shortFormQuestion),
          };

          // Push question answer onto new control question answers array
          newControl.questionsAnswered.push(newQuestionAnswer);
          // Add new control result to controls map
          getControlGroup.controlResults.set(control, newControl);
        }
      } else {
        // Create new question answer
        const newQuestionAnswer: QuestionAnswer = {
          shortFormQuestion,
          question,
          answer,
          followUp: this._getFollowUp(shortFormQuestion),
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

  // Get follow up answers for a question
  private _getFollowUp = (
    shortFormQuestion: string
  ): string | number | null => {
    // Return follow up : answer string or null
    let ret: string | number | null = null;

    // If assessment data has the followup question, grab it and set return to it
    if (this._assessmentData.has(`${shortFormQuestion}_followup`)) {
      const followUpAnswer = this._assessmentData.get(
        `${shortFormQuestion}_followup`
      )!;
      ret = followUpAnswer;
    }

    // Return ret
    return ret;
  };

  private _calculateScores = (report: ReportResult): ReportResult => {
    // Return variables place holder
    const ret = report;

    // Loop through control group results
    for (const [, controlGroupResult] of ret.controlGroupResults.entries()) {
      // Loop through control results within control groups
      for (const [
        ,
        controlResult,
      ] of controlGroupResult.controlResults.entries()) {
        // Loop through all questions associated with a control
        controlResult.questionsAnswered.forEach((questionAnswer) => {
          // Increment individual control, control group and overall max score for every question
          controlResult.maxScore = controlResult.maxScore + 1;
          controlGroupResult.maxScore = controlGroupResult.maxScore + 1;
          ret.maxScore = ret.maxScore + 1;

          if (
            typeof questionAnswer.answer === "string" &&
            questionAnswer.answer.toLowerCase() === "yes"
          ) {
            // If question is yes, incremement individual control, control group and overall score
            controlResult.score = controlResult.score + 1;
            controlGroupResult.score = controlGroupResult.score + 1;
            ret.score = ret.score + 1;
          }
        });
      }
    }

    return ret;
  };
}

export { Report };
